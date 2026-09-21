import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

def create_report():
    doc = docx.Document()

    # Configure Margins (1 inch on all sides)
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

        # Configure Footer Page Numbering (Bottom Center)
        footer = section.footer
        footer_p = footer.paragraphs[0]
        footer_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        footer_run = footer_p.add_run("Page ")
        footer_run.font.name = 'Times New Roman'
        footer_run.font.size = Pt(10)
        footer_run.font.color.rgb = RGBColor(100, 100, 100)

        # XML Page Number Field
        fldChar1 = parse_xml(r'<w:fldChar %s w:fldCharType="begin"/>' % nsdecls('w'))
        instrText = parse_xml(r'<w:instrText %s xml:space="preserve"> PAGE </w:instrText>' % nsdecls('w'))
        fldChar2 = parse_xml(r'<w:fldChar %s w:fldCharType="separate"/>' % nsdecls('w'))
        fldChar3 = parse_xml(r'<w:fldChar %s w:fldCharType="end"/>' % nsdecls('w'))
        r = footer_run._r
        r.append(fldChar1)
        r.append(instrText)
        r.append(fldChar2)
        r.append(fldChar3)

    # Styles Setup
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(12)
    normal_style.font.color.rgb = RGBColor(30, 30, 30)
    normal_style.paragraph_format.line_spacing = 1.5
    normal_style.paragraph_format.space_after = Pt(6)

    def add_main_heading(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(8)
        p.paragraph_format.keep_with_next = True
        p.paragraph_format.line_spacing = 1.5
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(14)
        run.font.bold = True
        run.font.color.rgb = RGBColor(31, 78, 120) # Deep Navy
        return p

    def add_sub_heading(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        p.paragraph_format.line_spacing = 1.5
        run = p.add_run(text)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(12)
        run.font.bold = True
        run.font.color.rgb = RGBColor(0, 51, 102)
        return p

    def add_body_p(text, bold_prefix=None):
        p = doc.add_paragraph()
        p.paragraph_format.line_spacing = 1.5
        p.paragraph_format.space_after = Pt(6)
        if bold_prefix:
            r_prefix = p.add_run(bold_prefix)
            r_prefix.font.name = 'Times New Roman'
            r_prefix.font.size = Pt(12)
            r_prefix.font.bold = True
            r_prefix.font.color.rgb = RGBColor(30, 30, 30)
        r_text = p.add_run(text)
        r_text.font.name = 'Times New Roman'
        r_text.font.size = Pt(12)
        r_text.font.color.rgb = RGBColor(30, 30, 30)
        return p

    def set_cell_background(cell, fill_hex):
        tcPr = cell._tc.get_or_add_tcPr()
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
        tcPr.append(shd)

    def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
        tcPr.append(tcMar)

    # ==========================================
    # COVER PAGE
    # ==========================================
    p_college = doc.add_paragraph()
    p_college.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_college.paragraph_format.space_before = Pt(18)
    p_college.paragraph_format.space_after = Pt(4)
    r_college = p_college.add_run("[COLLEGE NAME]")
    r_college.font.name = 'Times New Roman'
    r_college.font.size = Pt(18)
    r_college.font.bold = True
    r_college.font.color.rgb = RGBColor(31, 78, 120)

    p_dept = doc.add_paragraph()
    p_dept.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_dept.paragraph_format.space_after = Pt(28)
    r_dept = p_dept.add_run("DEPARTMENT OF COMPUTER SCIENCE")
    r_dept.font.name = 'Times New Roman'
    r_dept.font.size = Pt(14)
    r_dept.font.bold = True
    r_dept.font.color.rgb = RGBColor(70, 70, 70)

    p_rep = doc.add_paragraph()
    p_rep.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_rep.paragraph_format.space_after = Pt(20)
    r_rep = p_rep.add_run("PROJECT REPORT")
    r_rep.font.name = 'Times New Roman'
    r_rep.font.size = Pt(24)
    r_rep.font.bold = True
    r_rep.font.color.rgb = RGBColor(0, 51, 102)

    p_on = doc.add_paragraph()
    p_on.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_on.paragraph_format.space_after = Pt(12)
    r_on = p_on.add_run("ON")
    r_on.font.name = 'Times New Roman'
    r_on.font.size = Pt(12)

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_after = Pt(28)
    r_title = p_title.add_run("COLLEGE KNOWLEDGE VAULT:\nAN EXPERIENTIAL KNOWLEDGE PRESERVATION AND REPOSITORY SYSTEM")
    r_title.font.name = 'Times New Roman'
    r_title.font.size = Pt(16)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(31, 78, 120)

    p_part = doc.add_paragraph()
    p_part.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_part.paragraph_format.space_after = Pt(36)
    p_part.paragraph_format.line_spacing = 1.5
    r_part = p_part.add_run("Submitted in partial fulfillment of the requirements for the award of the degree of\nMASTER OF COMPUTER APPLICATIONS (MCA)\nThird Semester")
    r_part.font.name = 'Times New Roman'
    r_part.font.size = Pt(12)
    r_part.font.italic = True

    # Two column table for Submitted By and Under Guidance Of
    table_cov = doc.add_table(rows=1, cols=2)
    table_cov.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell_left = table_cov.cell(0, 0)
    cell_right = table_cov.cell(0, 1)

    p_sub = cell_left.paragraphs[0]
    p_sub.paragraph_format.line_spacing = 1.3
    r_sb = p_sub.add_run("SUBMITTED BY:\n")
    r_sb.font.bold = True
    r_sb.font.size = Pt(11)
    p_sub.add_run("[MEMBER 1 NAME] (Roll No: MCA301)\n[MEMBER 2 NAME] (Roll No: MCA302)\nDepartment of Computer Science")

    p_gui = cell_right.paragraphs[0]
    p_gui.paragraph_format.line_spacing = 1.3
    r_gb = p_gui.add_run("UNDER THE GUIDANCE OF:\n")
    r_gb.font.bold = True
    r_gb.font.size = Pt(11)
    p_gui.add_run("[GUIDE NAME]\nAssistant Professor / Associate Professor\nDepartment of Computer Science")

    p_space = doc.add_paragraph()
    p_space.paragraph_format.space_before = Pt(36)

    p_foot = doc.add_paragraph()
    p_foot.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_foot.paragraph_format.space_after = Pt(0)
    r_foot = p_foot.add_run("ACADEMIC YEAR: 2025-2026\nDATE: 18-08-2026")
    r_foot.font.name = 'Times New Roman'
    r_foot.font.size = Pt(12)
    r_foot.font.bold = True

    doc.add_page_break()

    # ==========================================
    # TABLE OF CONTENTS
    # ==========================================
    add_main_heading("TABLE OF CONTENTS")

    add_body_p("The table of contents below outlines the core structure of this project report for the College Knowledge Vault. Update the Word Table of Contents field code to align with dynamic page layout changes as needed.")

    # Native Word TOC Field
    p_toc_field = doc.add_paragraph()
    run_toc = p_toc_field.add_run()
    r_toc = run_toc._r
    fldChar1 = parse_xml(r'<w:fldChar %s w:fldCharType="begin"/>' % nsdecls('w'))
    instrText = parse_xml(r'<w:instrText %s xml:space="preserve"> TOC \o "1-3" \h \z \u </w:instrText>' % nsdecls('w'))
    fldChar2 = parse_xml(r'<w:fldChar %s w:fldCharType="separate"/>' % nsdecls('w'))
    fldChar3 = parse_xml(r'<w:fldChar %s w:fldCharType="end"/>' % nsdecls('w'))
    r_toc.append(fldChar1)
    r_toc.append(instrText)
    r_toc.append(fldChar2)
    r_toc.append(fldChar3)

    # Pre-formatted static TOC table for instant readability
    toc_items = [
        ("Section 1: Project Title & Team Details", "3"),
        ("Section 2: Abstract / Introduction", "4"),
        ("Section 3: Existing System", "5"),
        ("Section 4: Disadvantages of Existing System", "6"),
        ("Section 5: Proposed System", "7"),
        ("Section 6: Advantages of Proposed System", "8"),
        ("Section 7: Module Description", "9"),
        ("Section 8: Activity Diagram", "11"),
        ("Section 9: Data Flow Diagram (DFD)", "13"),
        ("Section 10: Use Case Diagram", "15"),
        ("Section 11: Expected Outcome / Future Scope", "17"),
        ("Section 12: Conclusion", "19")
    ]

    t_toc = doc.add_table(rows=len(toc_items) + 1, cols=2)
    t_toc.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_toc.autofit = False

    hdr_cells = t_toc.rows[0].cells
    hdr_cells[0].text = "Section Topic"
    hdr_cells[1].text = "Page No."
    set_cell_background(hdr_cells[0], "1F4E78")
    set_cell_background(hdr_cells[1], "1F4E78")
    for cell in hdr_cells:
        for p in cell.paragraphs:
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for r in p.runs:
                r.font.bold = True
                r.font.color.rgb = RGBColor(255, 255, 255)

    hdr_cells[0].width = Inches(5.0)
    hdr_cells[1].width = Inches(1.5)

    for idx, (topic, page_no) in enumerate(toc_items, start=1):
        row_cells = t_toc.rows[idx].cells
        row_cells[0].width = Inches(5.0)
        row_cells[1].width = Inches(1.5)
        row_cells[0].text = topic
        row_cells[1].text = page_no
        if idx % 2 == 0:
            set_cell_background(row_cells[0], "F2F4F8")
            set_cell_background(row_cells[1], "F2F4F8")

    doc.add_page_break()

    # ==========================================
    # SECTION 1: PROJECT TITLE & TEAM DETAILS
    # ==========================================
    add_main_heading("1. Project Title & Team Details")

    add_body_p("The Third Semester Master of Computer Applications (MCA) Industrial/Application-Level Project represents a key milestone in practical software engineering, systems design, and full-stack application development. This project document presents the complete specification, design architecture, module breakdown, and implementation methodology for College Knowledge Vault — an experiential knowledge preservation and repository mobile application platform.")

    add_sub_heading("1.1 Project Title")
    add_body_p("College Knowledge Vault — An Experiential Knowledge Preservation and Repository System", bold_prefix="Full Title: ")
    add_body_p("This project focuses on bridging the generational knowledge gap within higher education institutions by establishing a secure, scalable, and structured digital platform where graduating senior students archive their real-world project experiences, viva examination insights, technical pitfalls, and learning resources for junior peers.")

    add_sub_heading("1.2 Institutional and Project Ownership Metadata")

    meta_table = doc.add_table(rows=8, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_table.autofit = False

    meta_data = [
        ("Project Title", "College Knowledge Vault — An Experiential Knowledge Preservation and Repository System"),
        ("Academic Program", "Master of Computer Applications (MCA) — Third Semester"),
        ("Department", "Department of Computer Science"),
        ("Institution / College", "[COLLEGE NAME]"),
        ("Project Team Members", "1. [MEMBER 1 NAME] (Roll No: MCA301)\n2. [MEMBER 2 NAME] (Roll No: MCA302)"),
        ("Faculty Project Guide", "[GUIDE NAME], Department of Computer Science"),
        ("Academic Session", "2025 – 2026"),
        ("Submission Date", "18th August 2026")
    ]

    for idx, (label, val) in enumerate(meta_data):
        row = meta_table.rows[idx]
        cell_lbl, cell_val = row.cells[0], row.cells[1]
        cell_lbl.width = Inches(2.2)
        cell_val.width = Inches(4.3)

        cell_lbl.text = label
        cell_val.text = val

        set_cell_background(cell_lbl, "1F4E78")
        for p in cell_lbl.paragraphs:
            for r in p.runs:
                r.font.bold = True
                r.font.color.rgb = RGBColor(255, 255, 255)

        if idx % 2 == 1:
            set_cell_background(cell_val, "F9FAFB")
        else:
            set_cell_background(cell_val, "FFFFFF")

        set_cell_margins(cell_lbl, 80, 80, 120, 120)
        set_cell_margins(cell_val, 80, 80, 120, 120)

    add_sub_heading("1.3 Purpose and Project Scope")
    add_body_p("Higher education academic environments suffer from a recurrent loss of tacit knowledge. Every year, graduating senior students possess valuable insights regarding complex project architectures, common implementation bugs, external viva voce questioning styles, internal evaluation criteria, and curated technological learning paths. Once these seniors graduate, their hard-won experiential wisdom leaves the institution permanently.")

    add_body_p("The primary scope of College Knowledge Vault is to capture, structure, moderate, and digitize this practical knowledge into an accessible mobile repository. By providing role-based interactions across Students, Seniors, and Faculty, the system creates a self-sustaining institutional memory bank that enhances student academic performance, optimizes project selection, and eliminates redundant technical mistakes across successive academic batches.")

    doc.add_page_break()

    # ==========================================
    # SECTION 2: ABSTRACT / INTRODUCTION
    # ==========================================
    add_main_heading("2. Abstract / Introduction")

    add_sub_heading("2.1 Abstract")
    add_body_p("In academic institutions, a significant amount of experiential knowledge acquired by senior students is permanently lost upon their graduation. This knowledge includes viva examination question patterns, critical project architectural mistakes, ideal technology stack selections, and subject-specific learning resources. Consequently, junior students repeatedly commit the same technical errors and spend excessive time seeking contextual information that previous batches had already mastered.")

    add_body_p("To resolve this institutional challenge, College Knowledge Vault is designed and implemented as an advanced Android mobile application functioning as a centralized experiential knowledge repository platform. Graduating seniors submit structured knowledge entries categorized under Project Summaries, Viva Q&A, Mistakes & Fixes, and Resource Links prior to leaving the institution. To ensure high data integrity, all submissions undergo a mandatory faculty moderation workflow before being published to the live feed.")

    add_body_p("The platform is engineered using React Native CLI and TypeScript for high-performance cross-platform mobile rendering, coupled with Supabase PostgreSQL as a cloud backend utilizing Row Level Security (RLS). Secure authentication is enforced through Google OAuth restricted to institutional email domains. High-speed full-text search capability is powered by Algolia search engine integration, while automated user engagement and decision alerts are dispatched via Firebase Cloud Messaging (FCM). The system significantly reduces redundant student mistakes, optimizes viva voce preparation, and permanently preserves institutional intellectual capital.")

    add_sub_heading("2.2 Introduction and Background")
    add_body_p("Experiential knowledge—often referred to as tacit knowledge—is gained through direct practical involvement in coursework, software development projects, laboratory experiments, and oral viva voce examinations. Unlike traditional textbook content or formal lecture notes, experiential knowledge provides contextual solutions to real-world challenges, such as configuration pitfalls, framework incompatibilities, and subtle logic bugs.")

    add_body_p("In traditional college setups, experiential knowledge transfer occurs sporadically through informal senior-junior interactions, unorganized messaging groups, or verbal conversations. These informal mechanisms lack systematic archiving, data verification, and searchability, rendering valuable insights inaccessible to the broader student body over time. As academic semesters progress and batches transition out of college, institutional memory degrades.")

    add_sub_heading("2.3 Core Problem Statement")
    add_body_p("Every academic year, senior students graduate taking years of practical experience with them. Junior students entering upcoming semesters face significant hurdles:", bold_prefix="Problem Highlight: ")
    add_body_p("1. Lack of guidance regarding realistic project scope, leading to over-engineered or incomplete final semester projects.\n2. Inability to anticipate specific viva voce questioning styles during practical examinations, resulting in avoidable academic underperformance.\n3. Repeated occurrence of documented software integration bugs, framework configuration errors, and environment setup failures.\n4. Reliance on fragmented, unverified online notes that lack relevance to the institution's specific syllabus and evaluation standards.")

    add_sub_heading("2.4 Technology Stack Overview")
    add_body_p("College Knowledge Vault is implemented using state-of-the-art software technologies to ensure enterprise-grade reliability, data security, and responsive performance:", bold_prefix="System Stack: ")

    stack_table = doc.add_table(rows=6, cols=2)
    stack_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    stack_table.autofit = False

    stack_data = [
        ("Mobile Frontend", "React Native CLI, TypeScript, React Navigation v6, React Native MMKV"),
        ("State & Cache", "TanStack React Query v5, Context API, Optimistic State Updates"),
        ("Backend & Database", "Supabase Platform, PostgreSQL Database, Row Level Security (RLS) Policies"),
        ("Search Engine", "Algolia Full-Text Search API with InstantSearch Indexing"),
        ("Authentication", "Google OAuth 2.0 via Supabase Auth (Domain Restricted)"),
        ("Push Notifications", "Firebase Cloud Messaging (FCM), React Native Notifee")
    ]

    for idx, (layer, tech) in enumerate(stack_data):
        r_cells = stack_table.rows[idx].cells
        r_cells[0].width = Inches(2.0)
        r_cells[1].width = Inches(4.5)
        r_cells[0].text = layer
        r_cells[1].text = tech
        set_cell_background(r_cells[0], "1F4E78")
        for p in r_cells[0].paragraphs:
            for r in p.runs:
                r.font.bold = True
                r.font.color.rgb = RGBColor(255, 255, 255)
        if idx % 2 == 1:
            set_cell_background(r_cells[1], "F9FAFB")
        set_cell_margins(r_cells[0], 60, 60, 100, 100)
        set_cell_margins(r_cells[1], 60, 60, 100, 100)

    doc.add_page_break()

    # ==========================================
    # SECTION 3: EXISTING SYSTEM
    # ==========================================
    add_main_heading("3. Existing System")

    add_body_p("In the existing institutional framework, knowledge transfer between senior and junior students relies entirely on ad-hoc, informal, and unmanaged channels. The current environment lacks a centralized digital infrastructure designed to systematically record, categorize, verify, and retrieve practical academic experiences.")

    add_sub_heading("3.1 Informal Messaging Applications")
    add_body_p("Currently, students rely predominantly on instant messaging applications such as WhatsApp groups, Telegram channels, and informal cloud drives to exchange academic files. While these platforms facilitate instant peer-to-peer messaging, they are fundamentally unsuited for long-term knowledge management. Information shared within chat groups is non-indexed, unorganized, and quickly buried under thousands of daily conversation threads. As group administrators graduate or delete chat groups, critical links, code snippets, and study materials are lost permanently.")

    add_sub_heading("3.2 Generic Notes Sharing Websites and Portals")
    add_body_p("Some educational departments attempt to utilize generic file-sharing portals or shared cloud drives to distribute course materials. However, these systems focus strictly on static lecture slides and syllabus notes. They completely lack taxonomy for experiential knowledge—such as project bug resolutions, viva defense tactics, framework version compatibility logs, or faculty evaluation preferences. Furthermore, static drive folders contain no search indexing, rendering content discovery cumbersome.")

    add_sub_heading("3.3 Lack of Structured Taxonomy and Metadata")
    add_body_p("Existing systems do not categorize content by technological stack, course subject code, academic semester, difficulty level, or entry type. A junior student searching specifically for 'React Native Android Build Errors in Semester 3' has no mechanism to query existing platforms using structured metadata filters. Information remains stored as unstructured text or unlabelled PDF attachments.")

    add_sub_heading("3.4 Dependency on Personal Senior-Junior Relationships")
    add_body_p("Under the current mechanism, the quality and quantity of academic guidance a junior student receives is directly proportional to their personal social network within the campus. Introverted students, lateral entry candidates, or students without direct contacts in senior batches are completely deprived of mentorship and experiential insights. This creates an inequitable academic environment where information access is fragmented and discriminatory.")

    add_sub_heading("3.5 Unverified Oral Viva Voce Transfer")
    add_body_p("Oral viva voce examinations form a major component of MCA practical assessments. Questions asked by external examiners often revolve around recurring core themes, practical code execution logic, and system architecture defense. In the existing system, viva insights are passed verbally outside examination halls or written on temporary paper slips. Consequently, viva questions are never formally documented, curated, or rated by difficulty, forcing upcoming batches to enter practical examinations without structured preparation resources.")

    doc.add_page_break()

    # ==========================================
    # SECTION 4: DISADVANTAGES OF EXISTING SYSTEM
    # ==========================================
    add_main_heading("4. Disadvantages of Existing System")

    add_body_p("The absence of a dedicated knowledge preservation platform introduces severe operational, academic, and administrative inefficiencies within the institution. The primary disadvantages of the existing informal system are analyzed below:")

    add_sub_heading("1. Permanent Knowledge Loss Upon Graduation")
    add_body_p("The most critical defect of the current model is the complete dissipation of student expertise upon graduation. Each graduating batch accumulates extensive practical experience over three years of intensive coursework, lab assignments, and major projects. Once seniors leave the campus, their insights into framework choices, debugging steps, and examiner expectations vanish permanently, forcing the next batch to restart from scratch.")

    add_sub_heading("2. Lack of Structured Categorization and Search Taxonomy")
    add_body_p("Informal repositories like WhatsApp or Google Drive lack structured database taxonomy. Content cannot be filtered by subject code, tech stack tags (e.g., Python, Docker, React, PostgreSQL), semester level, or entry type (Project Summary vs. Viva Q&A). Searching for specific technical solutions requires manually scrolling through endless chat logs or opening dozens of nested folders.")

    add_sub_heading("3. Repetition of Technical Mistakes and Redundant Effort")
    add_body_p("Junior students routinely encounter identical technical obstacles that previous batches spent weeks resolving—such as SDK path mismatches, dependency conflicts, or database connection pool timeouts. Without an archive of 'Mistake & Fix' entries, junior students duplicate redundant troubleshooting efforts, wasting hundreds of collective study hours every semester.")

    add_sub_heading("4. Inconsistent and Discriminatory Knowledge Transfer")
    add_body_p("Information distribution under the existing system is highly inconsistent. Knowledge transfer depends on personal friendships, student club memberships, or fraternity networks. Students who lack direct personal connections to senior students are left without academic guidance, leading to widespread disparity in project quality and exam readiness.")

    add_sub_heading("5. Total Absence of Organized Viva Voce Preparation Resources")
    add_body_p("Practical viva voce examinations carry high credit weighting in the MCA curriculum. However, there is no centralized system to document real questions asked by external examiners during past lab exams. Students rely on rumor or superficial memory, leaving them unprepared for rigorous technical viva questioning.")

    add_sub_heading("6. Zero Quality Control and Proliferation of Misinformation")
    add_body_p("Informal communication channels feature no moderation or peer review. Incorrect project guidance, outdated code snippets, or inaccurate viva answers circulate without validation. Students executing flawed technical advice face project failures or academic penalties due to unverified content.")

    add_sub_heading("7. High Platform Dependency and Storage Transience")
    add_body_p("Relying on commercial messaging platforms exposes academic records to sudden data loss. Message histories are routinely cleared, media files expire on messaging servers, cloud folder links become invalid when account owners graduate, and group chats are deleted upon course completion.")

    add_sub_heading("8. Total Absence of Institutional Memory and Analytics")
    add_body_p("Academic departments have no formal record or visual analytics detailing what technological stacks students are mastering, what project mistakes are most prevalent, or how practical learning evolves over time. The institution remains unable to assess curriculum efficacy or identify recurring academic weak points.")

    doc.add_page_break()

    # ==========================================
    # SECTION 5: PROPOSED SYSTEM
    # ==========================================
    add_main_heading("5. Proposed System")

    add_sub_heading("5.1 Overview of College Knowledge Vault")
    add_body_p("The proposed system, College Knowledge Vault, is a state-of-the-art Android mobile application engineered to establish a permanent, structured, and faculty-moderated institutional knowledge repository. Built using React Native CLI, TypeScript, and Supabase PostgreSQL backend, the application creates a collaborative digital bridge between graduating seniors, junior learners, and academic faculty.")

    add_sub_heading("5.2 Multi-Tiered Role-Based Ecosystem")
    add_body_p("The platform defines three distinct user roles with strict Row Level Security (RLS) enforcement:", bold_prefix="Role Architecture: ")

    role_table = doc.add_table(rows=4, cols=3)
    role_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    role_table.autofit = False

    r_headers = role_table.rows[0].cells
    r_headers[0].text = "User Role"
    r_headers[1].text = "Target Persona"
    r_headers[2].text = "Core Permissions & Capabilities"
    set_cell_background(r_headers[0], "1F4E78")
    set_cell_background(r_headers[1], "1F4E78")
    set_cell_background(r_headers[2], "1F4E78")
    for cell in r_headers:
        for p in cell.paragraphs:
            for r in p.runs:
                r.font.bold = True
                r.font.color.rgb = RGBColor(255, 255, 255)

    r_headers[0].width = Inches(1.5)
    r_headers[1].width = Inches(1.8)
    r_headers[2].width = Inches(3.2)

    role_data = [
        ("Student (Junior)", "1st & 2nd Semester MCA Students", "Browse approved feed, filter by category/stack, perform sub-second full-text search, upvote entries, flag inappropriate content, view detail screens."),
        ("Senior (Contributor)", "3rd Semester MCA & Graduating Batches", "Inherits all Student permissions. Accesses 5-step Knowledge Submission Wizard, submits entries (Project/Viva/Mistake/Resource), tracks submission status in Dashboard."),
        ("Faculty (Moderator)", "Department Professors & Coordinators", "Inherits all Senior/Student permissions. Accesses Moderation Panel, reviews pending queue, approves/rejects submissions with reasons, resolves flagged content.")
    ]

    for idx, (r_name, r_target, r_perms) in enumerate(role_data, start=1):
        row_c = role_table.rows[idx].cells
        row_c[0].width = Inches(1.5)
        row_c[1].width = Inches(1.8)
        row_c[2].width = Inches(3.2)
        row_c[0].text = r_name
        row_c[1].text = r_target
        row_c[2].text = r_perms
        if idx % 2 == 0:
            set_cell_background(row_c[0], "F2F4F8")
            set_cell_background(row_c[1], "F2F4F8")
            set_cell_background(row_c[2], "F2F4F8")
        for cell in row_c:
            set_cell_margins(cell, 60, 60, 100, 100)

    add_sub_heading("5.3 Four Core Submission Categories")
    add_body_p("To structure experiential knowledge cleanly, the system categorizes all contributions into four distinct entry types:")
    add_body_p("1. Project Summary: High-level architectural overview, hardware/software requirements, database design, key features, and lessons learned during major/minor project development.\n2. Viva Q&A: Real viva voce questions encountered during practical exams, complete with difficulty ratings (Easy, Medium, Hard), model answers, and examiner expectations.\n3. Mistake & Fix: Real technical bugs, environment configuration errors, dependency clashes, and step-by-step resolution scripts.\n4. Resource Link: Curated documentation links, GitHub repository samples, tutorial video links, and academic reference materials.")

    add_sub_heading("5.4 Key Architectural Features")
    add_body_p("1. Google OAuth Domain Verification: Enforces sign-in using official college Google accounts, preventing unauthorized external access.\n2. Faculty Moderation Workflow: All submitted entries enter a pending moderation queue. Submissions become visible on the public feed only after explicit faculty approval.\n3. Algolia Full-Text Search: Sub-second indexed search capability enabling instant discovery across titles, descriptions, technology tags, and viva questions.\n4. Local Session Persistence & Offline Caching: Integrated MMKV key-value storage and React Query caching ensure instant app launch and offline entry viewing.\n5. Automated Push Notifications: Firebase Cloud Messaging (FCM) sends real-time alerts to authors upon faculty approval or rejection decisions.")

    doc.add_page_break()

    # ==========================================
    # SECTION 6: ADVANTAGES OF PROPOSED SYSTEM
    # ==========================================
    add_main_heading("6. Advantages of Proposed System")

    add_body_p("The College Knowledge Vault transforms institutional learning by providing significant technical, operational, and educational benefits:")

    add_sub_heading("1. Permanent Institutional Memory & Knowledge Preservation")
    add_body_p("The platform creates a digital institutional memory bank that persists indefinitely across academic years. Experiential insights from graduating seniors are permanently captured, ensuring that each incoming batch builds upon the collective wisdom of previous generations rather than starting from scratch.")

    add_sub_heading("2. Multi-Dimensional Structured Taxonomy & Tagging")
    add_body_p("Knowledge entries are categorized across multiple dimensions—entry type, subject code, academic semester (1–6), and technology stack tags (e.g., React Native, Node.js, Python, Supabase). Students can filter and query precise technical information within seconds.")

    add_sub_heading("3. Strict Quality Control via Faculty Moderation")
    add_body_p("By routing all submissions through a mandatory Faculty Moderation Panel prior to public publication, the system guarantees high data integrity, technical accuracy, and academic relevance. Misinformation and inappropriate content are completely eliminated.")

    add_sub_heading("4. Granular Role-Based Access Control (RBAC) & Data Security")
    add_body_p("Built-in Supabase Row Level Security (RLS) policies enforce strict data access rules at the database level. Students can read approved data; seniors can submit entries; faculty can moderate queues. Unauthorized data modification or administrative bypass is impossible.")

    add_sub_heading("5. Dedicated Viva Voce Preparation Environment")
    add_body_p("The specialized Viva Q&A category organizes actual examination questions accompanied by difficulty ratings (Easy, Medium, Hard) and verified model answers. This transforms viva preparation from guesswork into a structured, highly effective study routine.")

    add_sub_heading("6. Sub-Second Real-Time Search Powered by Algolia")
    add_body_p("Direct integration with Algolia InstantSearch provides sub-second, typo-tolerant full-text search capability. Students typing keywords like 'Docker' or 'Authentication Error' instantly retrieve relevant entries across the entire database.")

    add_sub_heading("7. Zero Knowledge Loss at Graduation Cycles")
    add_body_p("The 5-step submission wizard streamlines the knowledge capture process, encouraging graduating seniors to document their major project findings and exam experiences before leaving the institution.")

    add_sub_heading("8. Organic Scalability & Zero Manual Curation Overhead")
    add_body_p("The crowdsourced, peer-contributed architecture allows the repository to grow organically with every graduating class. Academic departments gain a massive knowledge hub without incurring content creation costs.")

    doc.add_page_break()

    # ==========================================
    # SECTION 7: MODULE DESCRIPTION
    # ==========================================
    add_main_heading("7. Module Description")

    add_body_p("The College Knowledge Vault architecture is partitioned into six highly decoupled, specialized software modules:")

    add_sub_heading("MODULE 1: Authentication & Identity Module")
    add_body_p("The Authentication Module manages user identity, single sign-on (SSO), role selection, and session security:", bold_prefix="Module Overview: ")
    add_body_p("• Google OAuth 2.0 Integration: Utilizes Supabase Auth and Google Sign-In SDK to authenticate users via institutional email domain (@college.edu).\n• Role Assignment Workflow: Upon initial login, users select their profile role (Student, Senior, or Faculty). Faculty roles trigger verification procedures.\n• Local Token Persistence: Authentication JWT tokens and refresh credentials are encrypted and stored locally using React Native MMKV for sub-millisecond application startup.\n• Role Guards & Navigation Control: Navigation stacks are wrapped in role-based guards, preventing unauthorized navigation to restricted screens.")

    add_sub_heading("MODULE 2: Knowledge Entry Submission Module")
    add_body_p("The Submission Module provides a guided 5-step wizard interface designed to capture structured experiential data:", bold_prefix="Module Overview: ")
    add_body_p("• Step 1 (Type Selection): 2x2 grid layout allowing selection between Project Summary, Viva Q&A, Mistake & Fix, or Resource Link.\n• Step 2 (Details Entry): Form fields for Title (min 10 chars), Detailed Description (min 30 chars), Subject Name/Code, and Semester (1–8).\n• Step 3 (Tag Selection): Interactive technology chip selector with predefined tags (e.g., React, Python, Supabase) and custom tag creation.\n• Step 4 (Viva Questions - Optional): Modal interface for adding structured Q&A pairs with difficulty radio buttons (Easy, Medium, Hard).\n• Step 5 (Review & Submit): Live preview of the compiled card, moderation warning banner, and one-tap submission trigger into the pending queue.")

    add_sub_heading("MODULE 3: Discovery & Search Module")
    add_body_p("The Discovery Module powers the main feed screen where students explore and filter approved entries:", bold_prefix="Module Overview: ")
    add_body_p("• Home Feed UI: High-performance rendering powered by @shopify/flash-list with layout item overrides for 60fps scrolling.\n• Multi-Category Filter Bar: Horizontal chip bar enabling one-tap filtering by All, Project, Viva, Mistake, or Resource.\n• Sorting Toggle: Switches feed ordering dynamically between 'Recent' (chronological) and 'Popular' (upvote count).\n• Algolia InstantSearch: Dedicated search bar executing sub-second full-text searches against indexed titles, tags, and description bodies.\n• Infinite Scroll & Pull-to-Refresh: Offset-based pagination loading 10 entries per chunk, coupled with native pull-to-refresh control.")

    add_sub_heading("MODULE 4: Content Moderation Module")
    add_body_p("The Moderation Module equips faculty members with tools to review, approve, reject, or sanitize submissions:", bold_prefix="Module Overview: ")
    add_body_p("• Faculty Queue Panel: Displays all pending entries ordered by submission date (oldest first).\n• Moderation Actions: One-tap Approval (moves entry to live feed) or Rejection (requires mandatory rejection feedback text).\n• Automated Author Alerts: Triggers background notification events upon decision execution.\n• Community Flagging & Auto-Hide: Students can flag inappropriate posts. Entries accumulating 3 or more flags are automatically hidden from the public feed pending faculty review.")

    add_sub_heading("MODULE 5: User Dashboard Module")
    add_body_p("The Dashboard Module provides personalized contribution tracking and profile management:", bold_prefix="Module Overview: ")
    add_body_p("• Analytics Stat Cards: Visual grid displaying four key user metrics—Total Submitted, Approved, Pending, and Rejected.\n• Personal History Feed: List of the user's submitted entries featuring real-time Status Badges (Green: Approved, Yellow: Pending, Red: Rejected).\n• Role-Based Floating Action Button (FAB): Senior and Faculty users see a prominent '+' FAB button triggering the submission flow.\n• Profile Sign Out: One-tap session termination clearing MMKV storage and query cache.")

    add_sub_heading("MODULE 6: Push Notification Module")
    add_body_p("The Notification Module handles real-time user communication and deep linking:", bold_prefix="Module Overview: ")
    add_body_p("• Firebase Cloud Messaging (FCM): Integrates FCM device tokens to dispatch targeted push notifications.\n• Foreground Banners & Background Alerts: Handles incoming alerts seamlessly across active app states.\n• Deep Linking Navigation: Tapping a notification automatically opens the specific entry detail screen or dashboard status tab.")

    doc.add_page_break()

    # ==========================================
    # SECTION 8: ACTIVITY DIAGRAM
    # ==========================================
    add_main_heading("8. Activity Diagram")

    add_body_p("This section provides a detailed textual representation of the system's operational Activity Flow Diagram. The activity flow captures user interactions, decision branches, database state transitions, and background process executions across the College Knowledge Vault platform.", bold_prefix="Diagram Title: ")

    add_sub_heading("8.1 Overall Authentication & Initial Routing Flow")
    add_body_p("1. Start -> User launches the College Knowledge Vault mobile application.\n2. System checks local session cache in MMKV storage.\n3. Decision: Is valid auth token present?\n   - If YES -> System navigates directly to Home Screen Feed.\n   - If NO -> System displays Login Screen with Google OAuth Button.\n4. User taps 'Sign in with Google' -> Google Sign-In SDK executes domain check.\n5. Decision: Is email domain valid institutional account?\n   - If NO -> Display error alert: 'Please use official college email'. Return to Login.\n   - If YES -> Supabase Auth authenticates user and returns JWT token.\n6. Decision: Is user profile existing in database?\n   - If NO -> Navigate to Role Selection Screen -> User picks role (Student/Senior/Faculty) -> Save user row -> Navigate to Home Screen.\n   - If YES -> Load user profile & role -> Navigate to Home Screen.")

    add_sub_heading("8.2 Senior Knowledge Submission Activity Flow")
    add_body_p("1. Senior taps Floating Action Button ('+') on Home or Dashboard Screen.\n2. System checks user role:\n   - If Student -> Display alert: 'Submissions are reserved for Seniors & Faculty'. Terminate flow.\n   - If Senior/Faculty -> Open Step 1 (Type Selection).\n3. Senior selects Category (Project / Viva / Mistake / Resource) -> Tap 'Next'.\n4. Step 2 (Details Entry) -> Senior enters Title, Description, Subject, Semester.\n5. Decision: Are Step 2 inputs valid (Title >= 10 chars, Desc >= 30 chars)?\n   - If NO -> Highlight invalid fields -> Stay on Step 2.\n   - If YES -> Enable 'Next' button -> Navigate to Step 3.\n6. Step 3 (Tag Selection) -> Senior selects tech chips or inputs custom tag -> Tap 'Next'.\n7. Step 4 (Viva Questions) -> Senior optionally adds Viva Q&A items -> Tap 'Next'.\n8. Step 5 (Review) -> Senior verifies preview card -> Taps 'Submit Entry'.\n9. System inserts entry into Supabase database with status = 'pending' -> Inserts associated tags and viva questions.\n10. System creates pending record in Moderation Queue table.\n11. System dispatches confirmation notification to Senior -> Navigates to Dashboard.")

    add_sub_heading("8.3 Faculty Moderation Activity Flow")
    add_body_p("1. Faculty opens Dashboard -> Taps 'Moderation Panel'.\n2. System queries Supabase for Moderation Queue items (status = 'pending', ordered by created_at ASC).\n3. Faculty selects a pending submission to inspect full details.\n4. Decision: Faculty decision choice?\n   - Option A [APPROVE]: Faculty taps 'Approve' -> System updates entry status to 'approved' -> Entry becomes queryable in public feed -> FCM dispatches push notification to Author: 'Your entry has been approved!'.\n   - Option B [REJECT]: Faculty taps 'Reject' -> Input modal opens -> Faculty enters rejection reason -> System updates entry status to 'rejected' -> FCM dispatches push notification to Author: 'Entry requires changes: [Reason]'.\n5. Moderation item removed from Pending Queue -> Panel updates live.")

    add_sub_heading("8.4 Student Discovery & Upvote Activity Flow")
    add_body_p("1. Student opens Home Screen Feed.\n2. System executes `useApprovedEntries` React Query hook -> Fetches initial 10 approved entries.\n3. Student taps Filter Bar Chip (e.g., 'Project') -> Feed updates dynamically.\n4. Student types keyword into Search Bar -> Algolia InstantSearch returns matching entries.\n5. Student taps Entry Card -> System opens Entry Detail Screen -> Fires `incrementViewCount` background RPC.\n6. Student taps Upvote Icon -> System executes optimistic UI upvote update -> Sends async request to `toggleUpvote` service.")

    doc.add_page_break()

    # ==========================================
    # SECTION 9: DATA FLOW DIAGRAM (DFD)
    # ==========================================
    add_main_heading("9. Data Flow Diagram (DFD)")

    add_body_p("The Data Flow Diagram (DFD) models the graphical transformation of data within the College Knowledge Vault system. It details external entities, inputs, outputs, processes, and database data stores across Level 0 and Level 1 abstraction layers.")

    add_sub_heading("9.1 Level 0 DFD (Context Diagram)")
    add_body_p("The Level 0 Context Diagram establishes the global system boundary. The central process is Process 0.0: College Knowledge Vault System, which interacts with three primary external entities and three backend infrastructure services:", bold_prefix="Context Boundaries: ")

    add_body_p("External Entities & Data Flows:\n"
               "1. Student Entity:\n"
               "   • Inputs to System: Credentials, Search Queries, Filter Selections, Upvote Toggles, Content Flags.\n"
               "   • Outputs from System: Approved Entry Feed, Detailed View Data, Search Results, Upvote Counts.\n"
               "2. Senior Entity:\n"
               "   • Inputs to System: Entry Metadata (Title, Desc, Tags, Viva Q&A), Updated Draft Content.\n"
               "   • Outputs from System: Submission Status Alerts, Personal Contribution Metrics.\n"
               "3. Faculty Entity:\n"
               "   • Inputs to System: Moderation Decisions (Approve/Reject), Rejection Feedback, Flag Resolutions.\n"
               "   • Outputs from System: Pending Moderation Queue, Flagged Content List, System Analytics.\n"
               "4. External Cloud Services (Supabase, Algolia, FCM):\n"
               "   • Data Flows: OAuth Verification Tokens, Database CRUD Payload, Search Index Batches, Push Notifications.")

    add_sub_heading("9.2 Level 1 DFD (Sub-Process Decomposition)")
    add_body_p("Level 1 DFD decomposes Process 0.0 into five specialized functional sub-processes:")

    add_body_p("Process 1.0: User Authentication & Role Management\n"
               "• Description: Validates Google OAuth tokens, extracts email domain, assigns user role, and creates session state.\n"
               "• Data Inputs: Google Auth Token from User.\n"
               "• Data Outputs: User Profile Row, Local MMKV Session JWT.\n"
               "• Target Data Store: Data Store D1 (Users Table).")

    add_body_p("Process 2.0: Knowledge Entry Submission & Formatting\n"
               "• Description: Validates step wizard inputs, normalizes tags, parses viva Q&A pairs, and creates pending entries.\n"
               "• Data Inputs: 5-Step Form Payload from Senior.\n"
               "• Data Outputs: Unapproved Entry Record, Tag Associations, Moderation Queue Item.\n"
               "• Target Data Store: Data Store D2 (Entries Table), Data Store D3 (Tags Table), Data Store D4 (Moderation Queue).")

    add_body_p("Process 3.0: Content Moderation & Quality Assurance\n"
               "• Description: Renders pending submissions for faculty review and executes status updates upon faculty action.\n"
               "• Data Inputs: Faculty Decision (Approve/Reject) & Rejection Reason.\n"
               "• Data Outputs: Updated Entry Status ('approved'/'rejected'), Trigger Event for Process 5.0.\n"
               "• Target Data Store: Data Store D2 (Entries Table), Data Store D4 (Moderation Queue).")

    add_body_p("Process 4.0: Knowledge Discovery & Search Indexing\n"
               "• Description: Executes offset-based queries on approved entries, handles upvoting, and maintains Algolia search indices.\n"
               "• Data Inputs: Filter Params, Search Keywords, Upvote Action from Student.\n"
               "• Data Outputs: Paginated Entry List, Search Results Payload, Updated Upvote Count.\n"
               "• Target Data Store: Data Store D2 (Entries Table), Data Store D5 (Upvotes Table), Algolia Index.")

    add_body_p("Process 5.0: Push Notification Delivery\n"
               "• Description: Listens for moderation events and dispatches targeted push notifications to user mobile devices.\n"
               "• Data Inputs: Moderation Event Signal from Process 3.0.\n"
               "• Data Outputs: FCM Push Alert Payload dispatched to User Device.\n"
               "• Target Data Store: Data Store D1 (Users Table - FCM Token).")

    doc.add_page_break()

    # ==========================================
    # SECTION 10: USE CASE DIAGRAM
    # ==========================================
    add_main_heading("10. Use Case Diagram")

    add_body_p("The Use Case Diagram defines the functional boundary of the system, illustrating how user actors (Student, Senior, Faculty) and system actors interact with core system features.", bold_prefix="Use Case Modeling: ")

    add_sub_heading("10.1 System Actors")
    add_body_p("1. Student (Junior): Primary consumer who browses, filters, searches, and interacts with approved knowledge.\n"
               "2. Senior (Contributor): Inherits all Student capabilities; primary author of project, viva, mistake, and resource entries.\n"
               "3. Faculty (Moderator): Inherits all Senior capabilities; administrative moderator responsible for queue review and quality assurance.\n"
               "4. Automated System Engine: Background system process managing auto-indexing, flag threshold monitoring, and FCM notification dispatch.")

    add_sub_heading("10.2 Detailed Use Case Specifications")

    uc_table = doc.add_table(rows=14, cols=4)
    uc_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    uc_table.autofit = False

    u_headers = uc_table.rows[0].cells
    u_headers[0].text = "UC ID"
    u_headers[1].text = "Use Case Title"
    u_headers[2].text = "Primary Actor"
    u_headers[3].text = "Description & Pre-conditions"
    for cell in u_headers:
        set_cell_background(cell, "1F4E78")
        for p in cell.paragraphs:
            for r in p.runs:
                r.font.bold = True
                r.font.color.rgb = RGBColor(255, 255, 255)

    u_headers[0].width = Inches(0.8)
    u_headers[1].width = Inches(1.8)
    u_headers[2].width = Inches(1.4)
    u_headers[3].width = Inches(2.5)

    use_cases = [
        ("UC-01", "Login with Google", "All Users", "Authenticates user using college Google OAuth account via Supabase Auth."),
        ("UC-02", "Select User Role", "All Users", "Initial setup screen allowing user to register as Student, Senior, or Faculty."),
        ("UC-03", "Browse Knowledge Feed", "Student", "Views infinite-scroll list of faculty-approved entries on Home Screen."),
        ("UC-04", "Search Entries", "Student", "Executes sub-second full-text keyword search via Algolia InstantSearch."),
        ("UC-05", "View Entry Details", "Student", "Opens full detail screen displaying full text, code snippets, tags, and viva Q&A."),
        ("UC-06", "Upvote Entry", "Student", "Toggles upvote status on an entry with optimistic UI updating."),
        ("UC-07", "Submit Entry", "Senior", "Launches 5-step submission wizard to create new entry in pending state."),
        ("UC-08", "Edit Own Entry", "Senior", "Modifies existing entry; submission resets to 'pending' for re-moderation."),
        ("UC-09", "Approve Entry", "Faculty", "Approves pending entry from Moderation Queue, publishing it to public feed."),
        ("UC-10", "Reject Entry with Reason", "Faculty", "Rejects submission with mandatory feedback text sent to author via push alert."),
        ("UC-11", "Flag Inappropriate Entry", "Student", "Flags offensive or incorrect entry; 3+ flags trigger auto-hiding."),
        ("UC-12", "View Personal Dashboard", "Senior/Student", "Displays 4 contribution stat cards and history of user's submissions with status badges."),
        ("UC-13", "View System Analytics", "Faculty", "Displays department-level analytics on active stacks, total entries, and approval rates.")
    ]

    for idx, (u_id, u_title, u_actor, u_desc) in enumerate(use_cases, start=1):
        r_c = uc_table.rows[idx].cells
        r_c[0].width = Inches(0.8)
        r_c[1].width = Inches(1.8)
        r_c[2].width = Inches(1.4)
        r_c[3].width = Inches(2.5)
        r_c[0].text = u_id
        r_c[1].text = u_title
        r_c[2].text = u_actor
        r_c[3].text = u_desc
        if idx % 2 == 0:
            for cell in r_c:
                set_cell_background(cell, "F2F4F8")
        for cell in r_c:
            set_cell_margins(cell, 50, 50, 80, 80)

    doc.add_page_break()

    # ==========================================
    # SECTION 11: EXPECTED OUTCOME / FUTURE SCOPE
    # ==========================================
    add_main_heading("11. Expected Outcome / Future Scope")

    add_sub_heading("11.1 Expected Outcomes")
    add_body_p("The deployment of College Knowledge Vault yields significant measurable benefits for the institution, student body, and academic faculty:")

    add_body_p("1. Permanent Knowledge Archiving: Establishes a centralized, searchable repository that permanently preserves practical insights from every graduating class.\n"
               "2. Reduction in Technical Mistakes: Decreases redundant student troubleshooting time by providing documented solutions to recurring build and code errors.\n"
               "3. Enhanced Viva Voce Performance: Improves practical exam readiness through a verified database of past viva questions and model answers.\n"
               "4. Equalized Knowledge Access: Eliminates reliance on personal senior-junior relationships, giving all enrolled students equal access to academic guidance.\n"
               "5. Faculty-Supervised Content Quality: Ensures all public resources undergo rigorous moderation before publication.\n"
               "6. Continuous Institutional Growth: System capacity and utility expand organically with each graduating batch without requiring manual administrative curation.")

    add_sub_heading("11.2 Future Scope & Roadmaps")
    add_body_p("While the current mobile application delivers comprehensive functionality for experiential knowledge sharing, future expansions will further enhance platform capability:")

    add_body_p("• Web Portal Version: Developing a React / Next.js web interface allowing desktop access for long-form code writing and faculty bulk moderation.\n"
               "• AI-Powered Recommendation Engine: Integrating machine learning algorithms to recommend tailored knowledge entries based on a student's current semester, course enrollment, and search history.\n"
               "• NLP Auto-Tagging: Implementing Natural Language Processing (NLP) models to automatically scan entry text and suggest relevant technology stack tags during submission.\n"
               "• Institutional ERP & LMS Integration: Connecting the platform with college ERP systems (e.g., Moodle, Canvas) to synchronize course codes and student enrollment records automatically.\n"
               "• Faculty Question Paper Generator: Providing faculty members with an export utility to automatically generate balanced viva examination question sets from top-rated archived Q&A entries.\n"
               "• Gamification & Achievement Badges: Introducing digital contribution badges (e.g., 'Top Bug Hunter', 'Master Mentor') and leaderboards to reward active senior contributors.\n"
               "• Inter-College Knowledge Network: Expanding the system architecture to support multi-tenant federated networks across affiliated university colleges.")

    doc.add_page_break()

    # ==========================================
    # SECTION 12: CONCLUSION
    # ==========================================
    add_main_heading("12. Conclusion")

    add_body_p("The College Knowledge Vault project successfully solves a pervasive, critical challenge in higher education: the permanent loss of experiential and practical knowledge when senior students graduate. By engineering a structured, mobile-first digital platform, the system ensures that hard-won practical insights—ranging from major project architectural choices to oral viva voce defense tactics—are retained indefinitely for the benefit of future academic generations.")

    add_body_p("From a technological perspective, the project demonstrates a robust, modern software architecture. Combining React Native CLI and TypeScript yields a high-performance, maintainable mobile frontend. Leveraging Supabase PostgreSQL with Row Level Security guarantees scalable data management and strict role-based access control. Integrating Algolia InstantSearch and Firebase Cloud Messaging delivers sub-second content discovery and real-time user notification alerts.")

    add_body_p("Functionally, the application establishes a balanced, multi-role ecosystem where graduating seniors contribute effortlessly through a guided 5-step wizard, faculty members maintain academic rigor via a dedicated moderation queue, and junior students discover verified insights instantly. The platform effectively eliminates redundant student errors, enhances examination preparedness, and democratizes access to academic mentorship.")

    add_body_p("In conclusion, College Knowledge Vault transforms institutional learning from a fragmented, transient process into a continuous, cumulative digital asset. The project satisfies all requirements for the Third Semester Master of Computer Applications (MCA) Industrial/Application-Level Project, laying a solid foundation for enterprise deployment and future academic innovations.")

    # Save document
    file_path = "College_Knowledge_Vault_Project_Report.docx"
    doc.save(file_path)
    print(f"Document successfully created and saved at: {file_path}")

if __name__ == "__main__":
    create_report()
