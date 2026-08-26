import re
for f in ['backend/api/routes/documents.py', 'backend/api/routes/study.py', 'backend/api/routes/user.py']:
    with open(f, 'r') as file:
        content = file.read()
    
    # find `Depends(get_current_user)\n    session: Session`
    # and replace with `Depends(get_current_user),\n    session: Session`
    content = re.sub(r'(Depends\(get_current_user\))\s*\n(\s*)session: Session', r'\1,\n\2session: Session', content)
    
    # what if it's `Depends(get_current_user) session: Session`? (No newline)
    content = re.sub(r'(Depends\(get_current_user\))\s+session: Session', r'\1, session: Session', content)
    
    with open(f, 'w') as file:
        file.write(content)
