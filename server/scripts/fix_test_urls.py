import os
import glob
import re

def fix_test_files():
    for filepath in glob.glob("tests/test_*.py"):
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        # Replace "/auth/..." with "/api/v1/auth/..."
        content = re.sub(r'\"/auth/', '"/api/v1/auth/', content)
        content = re.sub(r'\'/auth/', "'/api/v1/auth/", content)
        
        # Replace "/users/..." with "/api/v1/users/..."
        content = re.sub(r'\"/users/', '"/api/v1/users/', content)
        content = re.sub(r'\'/users/', "'/api/v1/users/", content)

        # Replace "/chats/..." with "/api/v1/chats/..."
        content = re.sub(r'\"/chats/', '"/api/v1/chats/', content)
        content = re.sub(r'\'/chats/', "'/api/v1/chats/", content)

        # Replace "/messages/..." with "/api/v1/messages/..."
        content = re.sub(r'\"/messages/', '"/api/v1/messages/', content)
        content = re.sub(r'\'/messages/', "'/api/v1/messages/", content)

        # Replace "/ws" with "/api/v1/ws"
        content = re.sub(r'\"/ws', '"/api/v1/ws', content)
        content = re.sub(r'\'/ws', "'/api/v1/ws", content)

        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
            
    print("Done replacing.")

if __name__ == "__main__":
    fix_test_files()
