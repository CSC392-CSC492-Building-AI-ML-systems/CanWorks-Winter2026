"""
Seed script for skills and templates tables.

Usage:
    cd pathfinder-backend
    python seed.py
"""

from database import SessionLocal, engine, Base
from models import Skill, Template

# Create tables if they don't exist yet
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# ── Skills ──────────────────────────────────────────────────────────────────

skills_data = [
    # Programming Languages
    ("Python", "Programming Languages"),
    ("JavaScript", "Programming Languages"),
    ("TypeScript", "Programming Languages"),
    ("Java", "Programming Languages"),
    ("C#", "Programming Languages"),
    ("C++", "Programming Languages"),
    ("Go", "Programming Languages"),
    ("Ruby", "Programming Languages"),
    ("PHP", "Programming Languages"),
    ("Swift", "Programming Languages"),
    ("Kotlin", "Programming Languages"),
    ("Rust", "Programming Languages"),
    ("R", "Programming Languages"),
    ("SQL", "Programming Languages"),

    # Frontend
    ("React", "Frontend"),
    ("Angular", "Frontend"),
    ("Vue.js", "Frontend"),
    ("Next.js", "Frontend"),
    ("HTML/CSS", "Frontend"),
    ("Tailwind CSS", "Frontend"),
    ("Svelte", "Frontend"),

    # Backend
    ("Node.js", "Backend"),
    ("Django", "Backend"),
    ("FastAPI", "Backend"),
    ("Spring Boot", "Backend"),
    ("Express.js", "Backend"),
    ("Flask", "Backend"),
    ("ASP.NET", "Backend"),
    ("Ruby on Rails", "Backend"),

    # Data & ML
    ("Machine Learning", "Data & ML"),
    ("Data Analysis", "Data & ML"),
    ("TensorFlow", "Data & ML"),
    ("PyTorch", "Data & ML"),
    ("Pandas", "Data & ML"),
    ("Tableau", "Data & ML"),
    ("Power BI", "Data & ML"),

    # Cloud & DevOps
    ("AWS", "Cloud & DevOps"),
    ("Azure", "Cloud & DevOps"),
    ("Google Cloud", "Cloud & DevOps"),
    ("Docker", "Cloud & DevOps"),
    ("Kubernetes", "Cloud & DevOps"),
    ("CI/CD", "Cloud & DevOps"),
    ("Terraform", "Cloud & DevOps"),
    ("Linux", "Cloud & DevOps"),
    ("Git", "Cloud & DevOps"),

    # Databases
    ("PostgreSQL", "Databases"),
    ("MySQL", "Databases"),
    ("MongoDB", "Databases"),
    ("Redis", "Databases"),
    ("Firebase", "Databases"),
    ("Supabase", "Databases"),

    # Design & Product
    ("Figma", "Design"),
    ("Adobe Creative Suite", "Design"),
    ("UI/UX Design", "Design"),
    ("Wireframing", "Design"),

    # Soft Skills
    ("Communication", "Soft Skills"),
    ("Team Leadership", "Soft Skills"),
    ("Problem Solving", "Soft Skills"),
    ("Project Management", "Soft Skills"),
    ("Agile/Scrum", "Soft Skills"),
    ("Time Management", "Soft Skills"),
    ("Critical Thinking", "Soft Skills"),

    # Business & Marketing
    ("Digital Marketing", "Business"),
    ("SEO/SEM", "Business"),
    ("Content Writing", "Business"),
    ("Financial Analysis", "Business"),
    ("Business Development", "Business"),
    ("CRM (Salesforce)", "Business"),
    ("Microsoft Excel", "Business"),
    ("Accounting", "Business"),
]

print("Seeding skills...")
added_skills = 0
for skill_name, category in skills_data:
    exists = db.query(Skill).filter(Skill.skill_name == skill_name).first()
    if not exists:
        db.add(Skill(skill_name=skill_name, skill_category=category))
        added_skills += 1
db.commit()
print(f"  Added {added_skills} new skills ({len(skills_data) - added_skills} already existed)")


# ── Templates ───────────────────────────────────────────────────────────────

templates_data = [
    {
        "template_name": "Junior Software Developer",
        "industry": "Technology",
        "job_title": "Junior Software Developer",
        "seniority_level": "Junior",
        "employment_type": "Full-Time",
        "job_description": "We are looking for a motivated Junior Software Developer to join our engineering team. You will work alongside senior developers to build and maintain web applications, write clean code, and participate in code reviews. This is an excellent opportunity for a recent graduate to grow their skills in a supportive environment.",
        "responsibilities": [
            "Write clean, maintainable code under the guidance of senior developers",
            "Participate in code reviews and team stand-ups",
            "Assist in debugging and resolving software defects",
            "Contribute to technical documentation",
            "Learn and adopt team coding standards and best practices"
        ],
        "qualifications": "Bachelor's degree in Computer Science or related field. Familiarity with at least one programming language (Python, JavaScript, or Java). Understanding of version control (Git). Strong willingness to learn.",
        "compensation_min": 50000,
        "compensation_max": 65000,
    },
    {
        "template_name": "Marketing Coordinator",
        "industry": "Marketing",
        "job_title": "Marketing Coordinator",
        "seniority_level": "Junior",
        "employment_type": "Full-Time",
        "job_description": "We are seeking a creative and organized Marketing Coordinator to support our marketing team. You will help plan and execute campaigns, manage social media channels, and analyze marketing metrics to drive brand awareness and engagement.",
        "responsibilities": [
            "Assist in planning and executing marketing campaigns across digital channels",
            "Manage and create content for social media platforms",
            "Track and report on campaign performance metrics",
            "Coordinate with designers and copywriters for marketing materials",
            "Help organize company events and webinars"
        ],
        "qualifications": "Bachelor's degree in Marketing, Communications, or related field. 1+ year of marketing experience or relevant internship. Familiarity with social media platforms and analytics tools. Strong written and verbal communication skills.",
        "compensation_min": 42000,
        "compensation_max": 55000,
    },
    {
        "template_name": "Data Analyst",
        "industry": "Technology",
        "job_title": "Data Analyst",
        "seniority_level": "Mid-Level",
        "employment_type": "Full-Time",
        "job_description": "We are hiring a Data Analyst to turn raw data into actionable insights. You will work with cross-functional teams to identify trends, build dashboards, and support data-driven decision making across the organization.",
        "responsibilities": [
            "Collect, clean, and analyze large datasets from multiple sources",
            "Build and maintain dashboards and reports using Tableau or Power BI",
            "Identify trends and patterns to support business decisions",
            "Collaborate with stakeholders to define KPIs and metrics",
            "Document data processes and maintain data quality standards"
        ],
        "qualifications": "Bachelor's degree in Statistics, Mathematics, Computer Science, or related field. 2+ years of experience in data analysis. Proficiency in SQL and Python or R. Experience with visualization tools (Tableau, Power BI). Strong analytical and problem-solving skills.",
        "compensation_min": 60000,
        "compensation_max": 80000,
    },
    {
        "template_name": "UX/UI Designer",
        "industry": "Technology",
        "job_title": "UX/UI Designer",
        "seniority_level": "Mid-Level",
        "employment_type": "Full-Time",
        "job_description": "We are looking for a talented UX/UI Designer to create intuitive and visually appealing user experiences. You will conduct user research, create wireframes and prototypes, and collaborate closely with developers to bring designs to life.",
        "responsibilities": [
            "Conduct user research and usability testing",
            "Create wireframes, mockups, and interactive prototypes in Figma",
            "Design responsive interfaces for web and mobile applications",
            "Collaborate with product managers and developers throughout the design process",
            "Maintain and evolve the company's design system"
        ],
        "qualifications": "Bachelor's degree in Design, HCI, or related field. 2+ years of UX/UI design experience. Proficiency in Figma or similar design tools. Strong portfolio demonstrating user-centered design process. Understanding of accessibility standards.",
        "compensation_min": 65000,
        "compensation_max": 85000,
    },
    {
        "template_name": "Customer Success Associate",
        "industry": "SaaS",
        "job_title": "Customer Success Associate",
        "seniority_level": "Junior",
        "employment_type": "Full-Time",
        "job_description": "We are looking for a Customer Success Associate to help our clients get the most out of our platform. You will onboard new customers, provide ongoing support, and work to ensure high satisfaction and retention rates.",
        "responsibilities": [
            "Onboard new customers and guide them through product setup",
            "Respond to customer inquiries via email, chat, and video calls",
            "Monitor customer health metrics and proactively address concerns",
            "Gather customer feedback and relay insights to the product team",
            "Create and maintain help documentation and training materials"
        ],
        "qualifications": "Bachelor's degree in Business, Communications, or related field. Excellent interpersonal and communication skills. Experience with CRM tools is an asset. Ability to manage multiple accounts simultaneously. Customer-first mindset.",
        "compensation_min": 45000,
        "compensation_max": 58000,
    },
    {
        "template_name": "Software Engineering Intern",
        "industry": "Technology",
        "job_title": "Software Engineering Intern",
        "seniority_level": "Intern",
        "employment_type": "Internship",
        "province": "Ontario",
        "city": "Toronto",
        "job_description": "Join our engineering team for a hands-on internship where you will contribute to real projects, learn industry best practices, and gain mentorship from experienced developers. This is a great opportunity for students looking to build practical experience.",
        "responsibilities": [
            "Contribute to feature development under the guidance of a mentor",
            "Write unit tests and participate in code reviews",
            "Attend team meetings and contribute ideas",
            "Document your work and present a demo at the end of the term"
        ],
        "qualifications": "Currently pursuing a degree in Computer Science or related field. Familiarity with Python or JavaScript. Basic understanding of Git and web development. Eagerness to learn and collaborate.",
        "compensation_min": 20,
        "compensation_max": 28,
    },
    {
        "template_name": "Senior Full-Stack Developer",
        "industry": "Technology",
        "job_title": "Senior Full-Stack Developer",
        "seniority_level": "Senior",
        "employment_type": "Full-Time",
        "job_description": "We are seeking a Senior Full-Stack Developer to lead the design and implementation of complex web applications. You will mentor junior developers, make architectural decisions, and drive technical excellence across the team.",
        "responsibilities": [
            "Design and implement scalable full-stack features using React and Node.js",
            "Lead technical design discussions and architecture reviews",
            "Mentor junior developers through code reviews and pair programming",
            "Collaborate with product and design teams to define technical requirements",
            "Improve CI/CD pipelines and development workflows",
            "Troubleshoot and resolve production issues"
        ],
        "qualifications": "Bachelor's degree in Computer Science or equivalent experience. 5+ years of full-stack development experience. Strong proficiency in React, TypeScript, Node.js, and PostgreSQL. Experience with cloud platforms (AWS or GCP). Proven ability to lead technical projects.",
        "compensation_min": 95000,
        "compensation_max": 130000,
    },
    {
        "template_name": "Nonprofit Program Coordinator",
        "industry": "Nonprofit",
        "job_title": "Program Coordinator",
        "seniority_level": "Mid-Level",
        "employment_type": "Full-Time",
        "job_description": "We are looking for a passionate Program Coordinator to manage and grow our community programs. You will oversee program logistics, engage with community partners, and track outcomes to ensure we are making a meaningful impact.",
        "responsibilities": [
            "Plan, coordinate, and execute community programs and events",
            "Build and maintain relationships with community partners and stakeholders",
            "Track program outcomes and prepare impact reports",
            "Manage program budgets and ensure efficient use of resources",
            "Recruit, train, and supervise program volunteers"
        ],
        "qualifications": "Bachelor's degree in Social Work, Public Administration, or related field. 2+ years of experience in program coordination or community engagement. Strong organizational and communication skills. Experience working with diverse communities. Proficiency in Microsoft Office.",
        "compensation_min": 48000,
        "compensation_max": 62000,
    },
]

print("Seeding templates...")
added_templates = 0
for t in templates_data:
    exists = db.query(Template).filter(Template.template_name == t["template_name"]).first()
    if not exists:
        db.add(Template(**t))
        added_templates += 1
db.commit()
print(f"  Added {added_templates} new templates ({len(templates_data) - added_templates} already existed)")

db.close()
print("Done!")
