import io
import pdfplumber
import httpx


def extract_text_from_pdf_url(url: str) -> str:
    """Download PDF from URL and extract text."""
    response = httpx.get(url, timeout=30)
    response.raise_for_status()

    text = ""
    with pdfplumber.open(io.BytesIO(response.content)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text.strip()
