import re

file_path = r'c:\Users\User\.gemini\antigravity\scratch\ValiantShop\src\pages\AdminDashboard.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

before = len(content)

# Fix mojibake: UTF-8 bytes read as Latin-1 then re-encoded as UTF-8
# e.g. 'e' (U+00E9) in UTF-8 is 0xC3 0xA9, read as Latin-1 gives 'Ã©'
replacements = [
    ('Ã©', 'e'), ('Ã¡', 'a'), ('Ã£', 'a'), ('Ã§', 'c'), ('Ã³', 'o'),
    ('Ã­', 'i'), ('Ã¢', 'a'), ('Ãª', 'e'), ('Ã´', 'o'),
    ('Ã‡', 'C'), ('Ã•', 'O'), ('Ã‰', 'E'), ('Ãµ', 'o'),
    ('Ã‚', 'A'), ('Ã±', 'n'), ('Ã¼', 'u'), ('Ã¸', 'o'), ('Ã¨', 'e'),
    ('Ã¬', 'i'), ('Ã²', 'o'), ('Ã¹', 'u'), ('Ãš', 'U'),
]

count = 0
for bad, good in replacements:
    new_content = content.replace(bad, good)
    count += content.count(bad)
    content = new_content

with open(file_path, 'w', encoding='utf-8', newline='') as f:
    f.write(content)

print(f'Fixed {count} corrupted character sequences. File saved as clean UTF-8.')
