import json
import re

input_file = 'events.txt'
output_file = 'events.json'

# Read the events.txt file
with open(input_file, 'r') as f:
    content = f.read()
content = content.replace("*","")
content = content.replace('\u2013', '-')
# Split events by blank lines
raw_events = re.split(r'\n\s*\n', content.strip())


# Parse each event
parsed_events = []
for event in raw_events:
    event_dict = {}
    for line in event.split('\n'):
        line.strip()
        if ':' in line:
            key, value = line.split(':', 1)
            key = key.strip().lower().replace(' ', '_')
            value = value.strip()
            event_dict[key] = value
    if event_dict:
        parsed_events.append(event_dict)

# Write to JSON file
with open(output_file, 'w') as f:
    json.dump(parsed_events, f, indent=2)

print(f"Converted {len(parsed_events)} events to {output_file}")