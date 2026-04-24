from flask import Flask, render_template, request, jsonify
import json
import os

app = Flask(__name__)

from datetime import datetime

# Service layer to handle statistics logic
class StatsService:
    def __init__(self, data_path):
        self.data_path = data_path

    def _get_days_in_range(self, daterange_str):
        if not daterange_str or 'to' not in daterange_str:
            return 7
        try:
            parts = daterange_str.split(' to ')
            d1 = datetime.strptime(parts[0].strip(), "%d-%m-%Y")
            d2 = datetime.strptime(parts[1].strip(), "%d-%m-%Y")
            return max(1, (d2 - d1).days)
        except Exception:
            return 7

    def get_stats(self, hashtag, daterange_str=None):
        days = self._get_days_in_range(daterange_str)
        try:
            with open(self.data_path, 'r') as f:
                all_data = json.load(f)
                raw_stats = all_data.get(hashtag, all_data.get('default'))
                
                # Scale multiplier (base is roughly a week)
                scale = days / 7.0
                
                # Standardized Response Pattern
                return {
                    "summary": {
                        "hashtag": hashtag,
                        "daterange": daterange_str or "All Time",
                        "changesets": int(raw_stats['summary']['changesets'] * scale),
                        "mappers": int(raw_stats['summary']['mappers'] * (scale ** 0.5)),
                        "changes": int(raw_stats['summary']['changes'] * scale)
                    },
                    "charts": {
                        "breakdown": raw_stats['breakdown'],
                        "trend": raw_stats['trend'],
                        "levels": raw_stats['levels']
                    }
                }
        except (FileNotFoundError, json.JSONDecodeError, KeyError):
            return self._get_error_response("Data format error or missing data")

    def _get_error_response(self, message):
        return {
            "summary": {"hashtag": "N/A", "daterange": "N/A", "changesets": 0, "mappers": 0, "changes": 0},
            "charts": {
                "breakdown": {"labels": ["No Data"], "data": [0]},
                "trend": {"labels": ["No Data"], "data": [0]},
                "levels": {"labels": ["No Data"], "data": [0]}
            },
            "error": message
        }

stats_service = StatsService(os.path.join(app.root_path, 'data', 'stats.json'))

@app.context_processor
def inject_year():
    return {'current_year': 2026}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/statistics')
def statistics():
    hashtag = request.args.get('hashtag', 'hotosm')
    daterange = request.args.get('daterange', 'All Time')
    
    # Use the standardized service to fetch data
    data = stats_service.get_stats(hashtag, daterange)

    return render_template(
        'statistics.html',
        hashtag=hashtag,
        daterange=daterange,
        data=data
    )

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/api/stats')
def api_stats():
    hashtag = request.args.get('hashtag', 'hotosm')
    daterange = request.args.get('daterange', 'All Time')
    return jsonify(stats_service.get_stats(hashtag, daterange))

if __name__ == '__main__':
    app.run(debug=True, port=5003)
