import pymupdf  # PyMuPDF
import logging

logger = logging.getLogger("talentmatch.pdf_extractor")

def extract_text_from_pdf(file_path: str) -> str:
    """Extract clean full text and metadata from a PDF file using PyMuPDF."""
    text_content = []
    try:
        doc = pymupdf.open(file_path)
        for page_num in range(len(doc)):
            page = doc[page_num]
            page_text = page.get_text("text")
            if page_text:
                text_content.append(page_text.strip())
        doc.close()
        return "\n\n".join(text_content)
    except Exception as e:
        logger.error(f"Error reading PDF {file_path}: {e}")
        raise ValueError(f"Could not extract text from PDF: {str(e)}")
