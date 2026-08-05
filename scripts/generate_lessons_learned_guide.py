from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "uploads" / "library"
OUT.mkdir(parents=True, exist_ok=True)
LOGO = ROOT / "public" / "pcmo-logo.png"
W, H = A4
NAVY, RED, SLATE, PALE = HexColor("#0b3764"), HexColor("#dc2626"), HexColor("#475569"), HexColor("#f1f5f9")

TITLE = "PCMO Lessons Learned Workshop Guide"
TOTAL_PAGES = 70

SECTIONS = ["Workshop Design", "Preparation", "Facilitation", "Evidence Capture", "Analysis"],
CONCEPTS = [
    "workshop objectives", "participant selection", "session agenda", "data collection", "facilitation prompts",
    "root cause analysis", "action ownership", "knowledge capture", "lessons register", "continuous improvement",
    "stakeholder engagement", "decision log", "risk feedback", "post-workshop review", "organisational learning",
]

def wrap(text, font, size, width):
    words, lines, current = text.split(), [], ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if stringWidth(candidate, font, size) <= width:
            current = candidate
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines

def make_guide():
    path = OUT / "lessons-learned-workshop-guide.pdf"
    pdf = canvas.Canvas(str(path), pagesize=A4, pageCompression=1)
    pdf.setTitle(TITLE)
    pdf.setAuthor("Project & Contracts Management Organisation (PCMO)")
    logo = ImageReader(str(LOGO))
    sections = SECTIONS[0]
    for page in range(1, TOTAL_PAGES + 1):
        section = sections[min((page - 1) // 14, len(sections) - 1)]
        concept = CONCEPTS[(page - 1) % len(CONCEPTS)]
        if page == 1:
            # Cover page
            pdf.setFillColor(NAVY)
            pdf.rect(0, 0, W, H, fill=1, stroke=0)
            pdf.setFillColor(HexColor("#ffffff"))
            pdf.roundRect(55, H - 190, W - 110, 105, 12, fill=1, stroke=0)
            pdf.drawImage(logo, 82, H - 165, width=W - 164, height=70, preserveAspectRatio=True, anchor='c')
            pdf.setFillColor(HexColor("#ffffff"))
            pdf.setFont("Helvetica-Bold", 26)
            y = H - 285
            for line in wrap(TITLE, "Helvetica-Bold", 26, W - 110):
                pdf.drawCentredString(W / 2, y, line)
                y -= 34
            pdf.setFillColor(HexColor("#fecaca"))
            pdf.setFont("Helvetica-Bold", 13)
            pdf.drawCentredString(W / 2, y - 15, f"{TOTAL_PAGES}-PAGE PROFESSIONAL GUIDE")
            pdf.setFillColor(HexColor("#cbd5e1"))
            pdf.setFont("Helvetica", 11)
            pdf.drawCentredString(W / 2, 72, "Member edition | PCMO Publications")
        else:
            # Content page
            pdf.setFillColor(PALE)
            pdf.rect(0, H - 66, W, 66, fill=1, stroke=0)
            pdf.drawImage(logo, 42, H - 55, width=145, height=40, preserveAspectRatio=True, anchor='wc')
            pdf.setFillColor(RED)
            pdf.setFont("Helvetica-Bold", 9)
            pdf.drawRightString(W - 42, H - 35, section.upper())
            heading = f"{page - 1}. {section}: {concept.title()}"
            pdf.setFillColor(NAVY)
            pdf.setFont("Helvetica-Bold", 22)
            y = H - 115
            for line in wrap(heading, "Helvetica-Bold", 22, W - 84):
                pdf.drawString(42, y, line)
                y -= 29
            intro = (f"This guide explains how {concept} supports a structured lessons learned workshop that "
                     f"converts project experience into reusable organisational knowledge. Adapt it to project "
                     f"scale, risk, contract terms, governance, and applicable law.")
            pdf.setFillColor(SLATE)
            pdf.setFont("Helvetica", 11)
            y -= 12
            for line in wrap(intro, "Helvetica", 11, W - 84):
                pdf.drawString(42, y, line)
                y -= 17
            blocks = [
                ("Purpose", f"Define why {concept} is needed, the decision it supports, and the accountable workshop owner."),
                ("Recommended practice", f"Document the current position, validate inputs, consult participants, agree the session approach, and retain evidence for {concept}."),
                ("Control checklist", "Confirm objectives; assign a facilitator; select participants; set the agenda; collect evidence; analyse causes; agree actions; assign owners; report outcomes."),
                ("Questions for the team", "What really happened? What went well? What should change? Which evidence is reliable? Who owns the improvement actions? How will we know it worked?"),
                ("Practical takeaway", f"Treat {concept} as a living workshop control. Review it when facts, risk exposure, delivery conditions, or contractual obligations change."),
            ]
            for label, body in blocks:
                y -= 16
                pdf.setFillColor(NAVY)
                pdf.setFont("Helvetica-Bold", 13)
                pdf.drawString(42, y, label)
                y -= 19
                pdf.setFillColor(SLATE)
                pdf.setFont("Helvetica", 10.5)
                for line in wrap(body, "Helvetica", 10.5, W - 84):
                    pdf.drawString(42, y, line)
                    y -= 15
            pdf.setStrokeColor(HexColor("#cbd5e1"))
            pdf.line(42, 48, W - 42, 48)
            pdf.setFillColor(SLATE)
            pdf.setFont("Helvetica", 8)
            pdf.drawString(42, 32, "PCMO Publications | Member learning resource")
            pdf.drawRightString(W - 42, 32, f"Page {page} of {TOTAL_PAGES}")
        pdf.showPage()
    pdf.save()
    print(path)

make_guide()
