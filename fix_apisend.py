import re

with open(r'C:\github\medwork-manager\medwork-frontend\src\components\CompanyGroupsCenter.jsx', 'r') as f:
    content = f.read()

def fix_apisend(match):
    url = match.group(1)
    method = match.group(2)
    rest = match.group(3)
    return 'apiSend(\'{}\', {}{})'.format(method, url, rest)

# Pattern: apiSend(/api/..., 'METHOD', ...) 
# Need to escape backticks and parentheses in regex
pattern = r'apiSend\\((/api/[^]+),\s*\\'(POST|PUT|DELETE|PATCH|GET)\\'\s*(,?[^)]*)\\)'
content = re.sub(pattern, fix_apisend, content)

with open(r'C:\github\medwork-manager\medwork-frontend\src\components\CompanyGroupsCenter.jsx', 'w') as f:
    f.write(content)

print('Done')
