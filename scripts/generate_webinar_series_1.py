from pathlib import Path
import subprocess, textwrap, wave
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg
import pyttsx3

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "webinars" / "series-1"
WORK = ROOT / "tmp" / "webinar-series-1"
LOGO = ROOT / "public" / "pcmo-logo.png"
OUT.mkdir(parents=True, exist_ok=True)
WORK.mkdir(parents=True, exist_ok=True)
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

FONT_DIR = Path(r"C:\Windows\Fonts")
def font(name, size):
    return ImageFont.truetype(str(FONT_DIR / name), size)

SERIES = [
    {
        "slug": "01-pm-and-contracts-together",
        "title": "Why Project Management and Contracts Management Must Work Together",
        "audience": "All professionals",
        "objective": "Introduce the PCMO philosophy of integrated project and contract delivery.",
        "topics": [
            ("Why projects fail", "Projects rarely fail because of one isolated technical problem. Misaligned scope, decisions, risk, obligations, records, cost, schedule, and relationships combine until recovery becomes difficult."),
            ("The danger of PM-CM silos", "Project teams may focus on delivery while contract teams focus on rights and obligations. When their information and decisions separate, change is recognised late and commercial consequences are misunderstood."),
            ("An integrated delivery model", "Successful delivery connects scope, schedule, cost, risk, change, procurement, obligations, notices, records, forecasting, governance, and stakeholder decisions in one operating rhythm."),
            ("The future professional", "Future-ready professionals understand both delivery and commercial context. They collaborate across disciplines, communicate uncertainty, preserve evidence, and make decisions that are practical and contract-aware."),
        ],
        "close": "Download the Integrated PM-CM Career Roadmap from the PCMO Library and identify the next capability you need to build.",
    },
    {
        "slug": "02-complete-project-lifecycle",
        "title": "The Complete Project Lifecycle Explained",
        "audience": "Beginners",
        "objective": "Understand the decisions, controls, and outputs across the complete project lifecycle.",
        "topics": [
            ("Initiation", "Define the problem or opportunity, intended benefits, strategic fit, stakeholders, initial scope, constraints, risks, options, sponsorship, and authority to proceed."),
            ("Planning", "Translate intent into an integrated plan for scope, schedule, cost, resources, procurement, contracts, risk, quality, communication, governance, and change control."),
            ("Execution", "Mobilise people and suppliers, produce deliverables, administer contracts, coordinate interfaces, manage quality, communicate decisions, and maintain reliable delivery records."),
            ("Monitoring and control", "Compare actual performance with approved baselines, analyse variance and trends, update forecasts, manage risk and change, escalate exceptions, and implement corrective action."),
            ("Closeout", "Complete and accept deliverables, close contracts, resolve open actions, transfer outputs, archive records, capture lessons, release resources, and review benefits."),
        ],
        "close": "Use the PCMO project lifecycle checklist to assess which decisions and records are required at your next stage gate.",
    },
    {
        "slug": "03-effective-scope-management",
        "title": "Building Successful Projects Through Effective Scope Management",
        "audience": "Project and contract professionals",
        "objective": "Build a controlled path from intended outcomes to accepted deliverables.",
        "topics": [
            ("Scope definition", "Clarify outcomes, requirements, deliverables, boundaries, assumptions, exclusions, acceptance criteria, constraints, interfaces, and responsibilities before detailed commitment."),
            ("Work breakdown structure", "Decompose deliverables into manageable work packages that support ownership, estimating, scheduling, budgeting, risk analysis, procurement, progress measurement, and control."),
            ("Scope creep", "Uncontrolled scope enters through informal requests, assumptions, design development, interface gaps, rework, stakeholder pressure, or work started before approval."),
            ("Scope control", "Capture proposed change, establish contractual and technical basis, evaluate impact, obtain authority, update baselines and obligations, communicate decisions, and verify implementation."),
        ],
        "close": "Review one current project and identify an unclear boundary, missing acceptance criterion, or unapproved change that needs action.",
    },
    {
        "slug": "04-project-scheduling-masterclass",
        "title": "Project Scheduling Masterclass",
        "audience": "Project controls and delivery professionals",
        "objective": "Use schedule logic to support credible commitments, forecasts, and recovery decisions.",
        "topics": [
            ("Critical path method", "Connect activities through realistic logic, durations, calendars, constraints, resources, and milestones so the schedule explains the sequence that controls completion."),
            ("Float", "Treat float as decision information, not free time. Understand total and free float, ownership questions, consumption, near-critical paths, and the effect of imposed constraints."),
            ("Baselines", "An approved baseline records the authorised delivery plan. It must be realistic, traceable, integrated with scope and cost, and changed only through controlled authority."),
            ("Recovery schedules", "Recovery starts with verified progress and remaining scope. Test productivity, logic, resources, interfaces, risks, contractual constraints, and alternative scenarios before committing to a date."),
        ],
        "close": "Challenge your next schedule review to explain the controlling path, major assumptions, float trend, risk exposure, and decision required.",
    },
    {
        "slug": "05-cost-control-commercial-awareness",
        "title": "Cost Control and Commercial Awareness for Project Professionals",
        "audience": "Project, controls, and commercial teams",
        "objective": "Connect cost performance with commercial obligations and forward-looking decisions.",
        "topics": [
            ("Budgeting", "Build an authorised cost baseline from scope, quantities, rates, resources, procurement strategy, contingency, risk, timing, assumptions, and control accounts."),
            ("Forecasting", "Forecast the expected final cost using actual commitments, incurred cost, remaining work, productivity, change, risk, escalation, claims exposure, and corrective action."),
            ("Earned value management", "Integrate planned value, earned value, and actual cost to understand schedule and cost performance. Use indices and estimates carefully, with attention to data quality and context."),
            ("Commercial decisions", "Evaluate payment, change, procurement, acceleration, risk allocation, supplier performance, cash flow, claims, and negotiation choices alongside delivery consequences."),
        ],
        "close": "At the next cost review, separate actual cost, commitments, approved change, potential change, risk exposure, and the evidence supporting the forecast.",
    },
    {
        "slug": "06-risk-management-that-works",
        "title": "Risk Management That Actually Works",
        "audience": "All project and contract professionals",
        "objective": "Make risk management a decision process rather than a reporting ritual.",
        "topics": [
            ("Risk registers", "Record clear cause-event-effect statements, categories, owners, probability, impact, proximity, controls, responses, actions, dates, residual exposure, and links to cost and schedule."),
            ("Risk ownership", "The risk owner must have appropriate accountability and influence. Action owners complete specific responses, while governance resolves exposure beyond delegated authority."),
            ("Risk responses", "Avoid, reduce, transfer, share, accept, or exploit uncertainty through specific actions. Evaluate cost, timing, secondary risk, contractual allocation, and the evidence that a response is working."),
            ("Practical application", "Use risk information in estimates, schedules, procurement, contracts, design, contingency, forecasts, change decisions, assurance, and executive escalation—not only in monthly reports."),
        ],
        "close": "Select the highest current exposure and confirm its owner, response, due date, decision threshold, and evidence of effectiveness.",
    },
]

NAVY, RED, SLATE, LIGHT, WHITE = "#0B3764", "#DC2626", "#475569", "#F1F5F9", "#FFFFFF"

def wrapped(draw, text, xy, fnt, fill, width, spacing=10):
    lines = textwrap.wrap(text, width=width)
    draw.multiline_text(xy, "\n".join(lines), font=fnt, fill=fill, spacing=spacing)

def make_slide(path, number, title, heading, body, footer):
    im = Image.new("RGB", (1280, 720), WHITE)
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, 1280, 18), fill=RED)
    d.rectangle((0, 600, 1280, 720), fill=NAVY)
    logo = Image.open(LOGO).convert("RGBA"); logo.thumbnail((260, 90)); im.paste(logo, (55, 45), logo)
    d.rounded_rectangle((1025, 50, 1215, 100), radius=18, fill=LIGHT)
    d.text((1055, 62), f"SERIES 1 · {number}", font=font("arialbd.ttf", 22), fill=RED)
    wrapped(d, title, (55, 155), font("arialbd.ttf", 38), NAVY, 48, 8)
    d.line((55, 285, 300, 285), fill=RED, width=7)
    wrapped(d, heading, (55, 315), font("arialbd.ttf", 32), NAVY, 48, 7)
    wrapped(d, body, (55, 385), font("arial.ttf", 24), SLATE, 82, 9)
    d.text((55, 640), footer, font=font("arialbd.ttf", 18), fill=WHITE)
    d.text((1120, 640), "PCMO", font=font("arialbd.ttf", 22), fill=WHITE)
    im.save(path, quality=92)

def narrate(text, path):
    engine = pyttsx3.init()
    engine.setProperty("rate", 172)
    engine.setProperty("volume", 1.0)
    voices = engine.getProperty("voices")
    if voices: engine.setProperty("voice", voices[0].id)
    engine.save_to_file(text, str(path)); engine.runAndWait(); engine.stop()

def duration(wav_path):
    with wave.open(str(wav_path), "rb") as w:
        return w.getnframes() / float(w.getframerate())

def produce(index, item):
    folder = WORK / item["slug"]; folder.mkdir(exist_ok=True)
    slides = [("Webinar objective", item["objective"])] + item["topics"] + [("Professional action", item["close"])]
    narration = f"Welcome to PCMO Series One, Project Management Fundamentals. Webinar {index}. {item['title']}. {item['objective']} " + " ".join(f"{h}. {b}" for h,b in slides[1:]) + " Thank you for learning with the Project and Contracts Management Organisation."
    wav_path = folder / "narration.wav"; narrate(narration, wav_path)
    total = max(duration(wav_path), 30); per_slide = total / len(slides)
    concat = folder / "slides.txt"
    lines=[]
    for i,(heading,body) in enumerate(slides,1):
        slide = folder / f"slide-{i:02}.png"
        make_slide(slide, f"{index:02}", item["title"], heading, body, f"Project Management Fundamentals · {item['audience']}")
        lines += [f"file '{slide.as_posix()}'", f"duration {per_slide:.3f}"]
    lines.append(f"file '{slide.as_posix()}'")
    concat.write_text("\n".join(lines), encoding="utf-8")
    output = OUT / f"{item['slug']}.mp4"
    subprocess.run([FFMPEG,"-y","-f","concat","-safe","0","-i",str(concat),"-i",str(wav_path),"-c:v","libx264","-preset","medium","-tune","stillimage","-pix_fmt","yuv420p","-r","25","-c:a","aac","-b:a","128k","-shortest","-movflags","+faststart",str(output)],check=True)
    print(output, f"{total:.1f}s")

for i, webinar in enumerate(SERIES, 1):
    produce(i, webinar)
