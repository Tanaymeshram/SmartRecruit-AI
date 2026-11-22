import json
import os
import re
import uuid
import asyncio
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

class LocalCollection:
    """Thread-safe and async-compatible JSON collection matching Motor/PyMongo API."""

    def __init__(self, file_path: Path):
        self.file_path = file_path
        self._lock = asyncio.Lock()
        self._ensure_file()

    def _ensure_file(self):
        if not self.file_path.exists():
            self.file_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump([], f)

    def _read_data(self) -> List[Dict[str, Any]]:
        try:
            if not self.file_path.exists():
                return []
            with open(self.file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def _write_data(self, data: List[Dict[str, Any]]):
        temp_file = self.file_path.with_suffix(".tmp")
        with open(temp_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, default=str)
        temp_file.replace(self.file_path)

    def _match_condition(self, doc_val: Any, cond_val: Any) -> bool:
        if isinstance(cond_val, dict):
            for op, val in cond_val.items():
                if op == "$eq" and doc_val != val:
                    return False
                elif op == "$ne" and doc_val == val:
                    return False
                elif op == "$gt" and not (doc_val > val):
                    return False
                elif op == "$gte" and not (doc_val >= val):
                    return False
                elif op == "$lt" and not (doc_val < val):
                    return False
                elif op == "$lte" and not (doc_val <= val):
                    return False
                elif op == "$in":
                    if isinstance(doc_val, list):
                        if not any(v in val for v in doc_val):
                            return False
                    elif doc_val not in val:
                        return False
                elif op == "$nin":
                    if isinstance(doc_val, list):
                        if any(v in val for v in doc_val):
                            return False
                    elif doc_val in val:
                        return False
                elif op == "$regex":
                    flags = re.IGNORECASE if cond_val.get("$options") == "i" else 0
                    if not re.search(val, str(doc_val or ""), flags):
                        return False
            return True
        elif isinstance(doc_val, list) and not isinstance(cond_val, list):
            return cond_val in doc_val
        else:
            return doc_val == cond_val

    def _matches(self, doc: Dict[str, Any], filter_dict: Dict[str, Any]) -> bool:
        if not filter_dict:
            return True
        for key, cond in filter_dict.items():
            if key == "$or" and isinstance(cond, list):
                if not any(self._matches(doc, sub_filter) for sub_filter in cond):
                    return False
            elif key == "$and" and isinstance(cond, list):
                if not all(self._matches(doc, sub_filter) for sub_filter in cond):
                    return False
            else:
                doc_val = doc.get(key)
                if not self._match_condition(doc_val, cond):
                    return False
        return True

    async def find(self, filter_dict: Optional[Dict[str, Any]] = None, sort=None, limit: int = 0, skip: int = 0) -> List[Dict[str, Any]]:
        async with self._lock:
            data = self._read_data()
            filter_dict = filter_dict or {}
            results = [d for d in data if self._matches(d, filter_dict)]
            
            if sort:
                for key, direction in reversed(sort):
                    results.sort(key=lambda x: x.get(key, ""), reverse=(direction < 0))
            if skip:
                results = results[skip:]
            if limit and limit > 0:
                results = results[:limit]
            return [dict(d) for d in results]

    async def find_one(self, filter_dict: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        async with self._lock:
            data = self._read_data()
            filter_dict = filter_dict or {}
            for doc in data:
                if self._matches(doc, filter_dict):
                    return dict(doc)
            return None

    async def insert_one(self, doc: Dict[str, Any]):
        async with self._lock:
            data = self._read_data()
            new_doc = dict(doc)
            if "_id" not in new_doc:
                new_doc["_id"] = str(uuid.uuid4())
            now_iso = datetime.now(timezone.utc).isoformat()
            new_doc.setdefault("created_at", now_iso)
            new_doc.setdefault("updated_at", now_iso)
            data.append(new_doc)
            self._write_data(data)
            class InsertResult:
                inserted_id = new_doc["_id"]
            return InsertResult()

    async def update_one(self, filter_dict: Dict[str, Any], update_dict: Dict[str, Any]):
        async with self._lock:
            data = self._read_data()
            modified = 0
            for doc in data:
                if self._matches(doc, filter_dict):
                    if "$set" in update_dict:
                        for k, v in update_dict["$set"].items():
                            doc[k] = v
                    if "$inc" in update_dict:
                        for k, v in update_dict["$inc"].items():
                            doc[k] = doc.get(k, 0) + v
                    if "$push" in update_dict:
                        for k, v in update_dict["$push"].items():
                            doc.setdefault(k, []).append(v)
                    doc["updated_at"] = datetime.now(timezone.utc).isoformat()
                    modified = 1
                    break
            self._write_data(data)
            class UpdateResult:
                modified_count = modified
            return UpdateResult()

    async def delete_one(self, filter_dict: Dict[str, Any]):
        async with self._lock:
            data = self._read_data()
            original_len = len(data)
            for i, doc in enumerate(data):
                if self._matches(doc, filter_dict):
                    data.pop(i)
                    break
            self._write_data(data)
            class DeleteResult:
                deleted_count = original_len - len(data)
            return DeleteResult()

    async def count_documents(self, filter_dict: Optional[Dict[str, Any]] = None) -> int:
        async with self._lock:
            data = self._read_data()
            filter_dict = filter_dict or {}
            return sum(1 for d in data if self._matches(d, filter_dict))

    async def distinct(self, field: str, filter_dict: Optional[Dict[str, Any]] = None) -> List[Any]:
        async with self._lock:
            data = self._read_data()
            filter_dict = filter_dict or {}
            vals = set()
            for d in data:
                if self._matches(d, filter_dict):
                    v = d.get(field)
                    if isinstance(v, list):
                        vals.update(v)
                    elif v is not None:
                        vals.add(v)
            return list(vals)

class LocalDatabase:
    """Manages collections in storage directory."""
    def __init__(self, db_dir: str):
        self.db_dir = Path(db_dir)
        self.db_dir.mkdir(parents=True, exist_ok=True)
        self._collections: Dict[str, LocalCollection] = {}

    def __getitem__(self, name: str) -> LocalCollection:
        if name not in self._collections:
            file_path = self.db_dir / f"{name}.json"
            self._collections[name] = LocalCollection(file_path)
        return self._collections[name]

