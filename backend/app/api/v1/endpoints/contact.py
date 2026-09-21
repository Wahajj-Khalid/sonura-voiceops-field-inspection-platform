import logging
from pydantic import BaseModel, EmailStr, Field
from fastapi import APIRouter, HTTPException, status, BackgroundTasks
from app.adapters.email.resend_adapter import ResendEmailAdapter

logger = logging.getLogger("contact-inquiry-endpoint")
router = APIRouter(prefix="/contact", tags=["Contact and Sales Inquiries"])

email_adapter = ResendEmailAdapter()

class ContactInquiryRequest(BaseModel):
    organization: str = Field(..., min_length=2, max_length=150)
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    scale: str = Field(default="10-50")
    message: str = Field(default="")

async def dispatch_inquiry_emails(inquiry: ContactInquiryRequest):
    admin_html = f"""
    <h2>New Enterprise Commercial Inquiry</h2>
    <p><strong>Organization:</strong> {inquiry.organization}</p>
    <p><strong>Contact Name:</strong> {inquiry.name}</p>
    <p><strong>Email:</strong> {inquiry.email}</p>
    <p><strong>Fleet Scale:</strong> {inquiry.scale}</p>
    <p><strong>Requirements Scope:</strong> {inquiry.message or "Standard Pilot Walkthrough"}</p>
    """
    await email_adapter.send_transactional_email(
        to_email="sales@sonura.ai",
        subject=f"Commercial Pilot Request: {inquiry.organization}",
        html_content=admin_html
    )

    customer_html = f"""
    <h2>Thank You for Contacting Sonura</h2>
    <p>Dear {inquiry.name},</p>
    <p>We have received your commercial inquiry for <strong>{inquiry.organization}</strong>.</p>
    <p>A solutions engineer will reach out to schedule your live walkthrough within 24 business hours.</p>
    <p>Best regards,<br>Sonura Solutions Engineering Team</p>
    """
    await email_adapter.send_transactional_email(
        to_email=inquiry.email,
        subject="Sonura Enterprise Pilot Request Received",
        html_content=customer_html
    )

@router.post("/inquiry", status_code=status.HTTP_200_OK)
async def submit_contact_inquiry(
    payload: ContactInquiryRequest,
    background_tasks: BackgroundTasks
):
    try:
        background_tasks.add_task(dispatch_inquiry_emails, payload)
        return {"status": "success", "message": "Inquiry submitted successfully."}
    except Exception as e:
        logger.error(f"Error processing inquiry: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process contact inquiry.")