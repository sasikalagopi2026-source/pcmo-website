from pathlib import Path
import sys
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf"
OUT.mkdir(parents=True, exist_ok=True)
LOGO = ROOT / "public" / "pcmo-logo.png"
W, H = A4
NAVY, RED, SLATE, PALE = HexColor("#0b3764"), HexColor("#dc2626"), HexColor("#475569"), HexColor("#f1f5f9")

BOOKS = [
    ("project-management-field-guide", "PCMO Project Management Field Guide", ["Foundations", "Initiation", "Planning", "Scheduling", "Cost", "Risk", "Quality", "Leadership", "Delivery", "Closeout"],
     ["business case", "stakeholder map", "project charter", "scope baseline", "work breakdown structure", "critical path", "cost forecast", "risk register", "quality plan", "change control", "team leadership", "supplier coordination", "performance reporting", "lessons learned"]),
    ("contract-management-practice-handbook", "PCMO Contract Management Practice Handbook", ["Strategy", "Formation", "Tendering", "Negotiation", "Administration", "Performance", "Change", "Claims", "Compliance", "Closeout"],
     ["contract strategy", "scope clarity", "evaluation criteria", "negotiation plan", "obligation register", "notice requirements", "variation control", "payment certification", "claims assessment", "relationship governance", "ethics review", "dispute avoidance", "records management", "contract closeout"]),
    ("integrated-project-contract-playbook", "PCMO Integrated Project and Contract Playbook", ["Alignment", "Governance", "Controls", "Commercial", "Delivery", "Assurance", "Change", "Recovery", "Leadership", "Value"],
     ["governance model", "delivery strategy", "commercial alignment", "integrated baseline", "decision rights", "interface control", "supplier performance", "change impact", "forecast confidence", "issue escalation", "recovery planning", "value assurance", "executive reporting", "benefits realisation"]),
]

def wrap(text, font, size, width):
    words, lines, current = text.split(), [], ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if stringWidth(candidate, font, size) <= width: current = candidate
        else: lines.append(current); current = word
    if current: lines.append(current)
    return lines

def make_book(slug, title, sections, concepts):
    path = OUT / f"{slug}.pdf"
    pdf = canvas.Canvas(str(path), pagesize=A4, pageCompression=1)
    pdf.setTitle(title); pdf.setAuthor("Project & Contracts Management Organisation (PCMO)")
    logo = ImageReader(str(LOGO))
    for page in range(1, 101):
        section = sections[min((page - 1) // 10, 9)]
        concept = concepts[(page - 1) % len(concepts)]
        if page == 1:
            pdf.setFillColor(NAVY); pdf.rect(0, 0, W, H, fill=1, stroke=0)
            pdf.setFillColor(HexColor("#ffffff")); pdf.roundRect(55, H-190, W-110, 105, 12, fill=1, stroke=0)
            pdf.drawImage(logo, 82, H-165, width=W-164, height=70, preserveAspectRatio=True, anchor='c')
            pdf.setFillColor(HexColor("#ffffff")); pdf.setFont("Helvetica-Bold", 27)
            y = H-285
            for line in wrap(title, "Helvetica-Bold", 27, W-110): pdf.drawCentredString(W/2, y, line); y -= 36
            pdf.setFillColor(HexColor("#fecaca")); pdf.setFont("Helvetica-Bold", 13); pdf.drawCentredString(W/2, y-15, "100-PAGE PROFESSIONAL PUBLICATION")
            pdf.setFillColor(HexColor("#cbd5e1")); pdf.setFont("Helvetica", 11); pdf.drawCentredString(W/2, 72, "Member edition | PCMO Publications")
        else:
            pdf.setFillColor(PALE); pdf.rect(0, H-66, W, 66, fill=1, stroke=0)
            pdf.drawImage(logo, 42, H-55, width=145, height=40, preserveAspectRatio=True, anchor='c')
            pdf.setFillColor(RED); pdf.setFont("Helvetica-Bold", 9); pdf.drawRightString(W-42, H-35, section.upper())
            heading = f"{page-1}. {section}: {concept.title()}"
            pdf.setFillColor(NAVY); pdf.setFont("Helvetica-Bold", 22); y=H-115
            for line in wrap(heading, "Helvetica-Bold", 22, W-84): pdf.drawString(42, y, line); y-=29
            intro = f"This practice note explains how {concept} supports disciplined {title.replace('PCMO ', '').lower()} decisions. Use it as a working prompt and adapt it to project scale, risk, contract terms, governance, and applicable law."
            pdf.setFillColor(SLATE); pdf.setFont("Helvetica", 11); y-=12
            for line in wrap(intro, "Helvetica", 11, W-84): pdf.drawString(42, y, line); y-=17
            blocks = [
                ("Purpose", f"Define why {concept} is needed, the decision it supports, and the accountable owner."),
                ("Recommended practice", f"Document the current position, validate inputs, consult affected stakeholders, approve the approach, and retain evidence for {concept}."),
                ("Control checklist", f"Confirm ownership; establish dates; identify dependencies; record assumptions; assess risk; obtain approval; monitor actions; report exceptions."),
                ("Questions for the team", f"What outcome is required? Which evidence is reliable? Who can approve? What could change? How will completion and value be demonstrated?"),
                ("Practical takeaway", f"Treat {concept} as a living management control. Review it when facts, risk exposure, delivery conditions, or contractual obligations change."),
            ]
            for label, body in blocks:
                y -= 16; pdf.setFillColor(NAVY); pdf.setFont("Helvetica-Bold", 13); pdf.drawString(42, y, label); y -= 19
                pdf.setFillColor(SLATE); pdf.setFont("Helvetica", 10.5)
                for line in wrap(body, "Helvetica", 10.5, W-84): pdf.drawString(42, y, line); y -= 15
            pdf.setStrokeColor(HexColor("#cbd5e1")); pdf.line(42, 48, W-42, 48)
            pdf.setFillColor(SLATE); pdf.setFont("Helvetica", 8); pdf.drawString(42, 32, "PCMO Publications | Member learning resource")
            pdf.drawRightString(W-42, 32, f"Page {page} of 100")
        pdf.showPage()
    pdf.save()
    print(path)

requested = set(sys.argv[1:])
for book in BOOKS:
    if not requested or book[0] in requested:
        make_book(*book)
