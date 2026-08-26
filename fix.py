import os
for f in ['backend/api/routes/documents.py', 'backend/api/routes/study.py', 'backend/api/routes/user.py']:
    with open(f, 'r') as file:
        content = file.read()
    content = content.replace(',\n, session', ',\n    session')
    content = content.replace(',\n    , session', ',\n    session')
    content = content.replace('(\n, session', '(\n    session')
    content = content.replace('(, session', '(session')
    # Let's just fix any occurrences of `, , session` or similar
    import re
    content = re.sub(r',\s*, session', ', session', content)
    # Also if there's an orphaned comma at start of line
    content = re.sub(r'\n\s*,\s*session', '\n    session', content)
    with open(f, 'w') as file:
        file.write(content)
