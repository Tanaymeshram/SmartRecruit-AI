import docx
import logging

logger = logging.getLogger("talentmatch.docx_extractor")

def extract_text_from_docx(file_path: str) -> str:
    """Extract clean full text from DOCX file including tables and paragraphs."""
    try:
        doc = docx.Document(file_path)
        full_text = []

        # Extract regular paragraphs
        for para in doc.paragraphs:
            if para.text.strip():
                full_text.append(para.text.strip())

        # Extract content from tables
        for table in doc.tables:
            for row in table.rows:
                row_texts = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if row_texts:
                    full_text.append(" | ".join(row_texts))

        return "\n".join(full_text)
    except Exception as e:
        logger.error(f"Error reading DOCX {file_path}: {e}")
        raise ValueError(f"Could not extract text from DOCX: {str(e)}")

