import os

def search_text(directory, term):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if term.lower() in content.lower():
                            print(f"Found '{term}' in: {path}")
                except Exception as e:
                    pass

search_text("C:\\Users\\gunas\\.gemini\\antigravity\\scratch\\m1g-web-app\\src", "baseCampEquipment")
search_text("C:\\Users\\gunas\\.gemini\\antigravity\\scratch\\m1g-web-app\\src", "baseCampMembers")
