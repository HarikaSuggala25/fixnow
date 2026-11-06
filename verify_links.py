"""
FixNow - Link & Asset Verification Script
Verifies that all local links, scripts, and stylesheets resolve to existing files.
"""

import os
import re
import sys
from html.parser import HTMLParser

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class LinkExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.scripts = []
        self.stylesheets = []

    def handle_starttag(self, tag, attrs):
        attr_dict = dict(attrs)
        if tag == 'a' and 'href' in attr_dict:
            self.links.append(attr_dict['href'])
        elif tag == 'script' and 'src' in attr_dict:
            self.scripts.append(attr_dict['src'])
        elif tag == 'link' and attr_dict.get('rel') == 'stylesheet' and 'href' in attr_dict:
            self.stylesheets.append(attr_dict['href'])

def verify_file(target_file, source_file):
    # Ignore anchors and external URLs
    if target_file.startswith('#') or target_file.startswith('tel:') or target_file.startswith('mailto:'):
        return True
    if target_file.startswith('http://') or target_file.startswith('https://'):
        return True
    
    # Strip query parameters or hash
    clean_target = target_file.split('?')[0].split('#')[0]
    if not clean_target:
        return True

    resolved_path = os.path.normpath(os.path.join(os.path.dirname(source_file), clean_target))
    exists = os.path.exists(resolved_path)
    return exists

def run_verification():
    print("=" * 60)
    print("FixNow Prototype Link & Asset Integrity Check")
    print("=" * 60)

    html_files = [f for f in os.listdir(BASE_DIR) if f.endswith('.html')]
    total_checks = 0
    errors = []

    for html_name in html_files:
        html_path = os.path.join(BASE_DIR, html_name)
        with open(html_path, 'r', encoding='utf-8') as f:
            content = f.read()

        parser = LinkExtractor()
        parser.feed(content)

        # Check links
        for link in parser.links:
            total_checks += 1
            if not verify_file(link, html_path):
                errors.append(f"[{html_name}] Broken link: {link}")

        # Check scripts
        for script in parser.scripts:
            total_checks += 1
            if not verify_file(script, html_path):
                errors.append(f"[{html_name}] Missing script: {script}")

        # Check stylesheets
        for sheet in parser.stylesheets:
            total_checks += 1
            if not verify_file(sheet, html_path):
                errors.append(f"[{html_name}] Missing stylesheet: {sheet}")

    print(f"Scanned {len(html_files)} HTML files with {total_checks} total references checked.")
    if errors:
        print(f"❌ Found {len(errors)} broken references:")
        for err in errors:
            print("  - " + err)
        return False
    else:
        print("✅ All internal links, script includes, and CSS references are 100% valid!")
        return True

if __name__ == '__main__':
    success = run_verification()
    exit(0 if success else 1)
