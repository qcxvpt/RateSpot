from flask import Flask, render_template, jsonify
import json

app = Flask(__name__)
EXCHANGES_FILE = 'exchanges.json'

@app.route('/')
def index():
    return render_template('main.html')

@app.route('/api/exchanges')
def api_exchanges():
    try:
        with open(EXCHANGES_FILE, 'r', encoding='utf-8') as f:
            exchanges = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        exchanges = []
    # Возвращаем данные без курсов — просто имя и координаты
    simple_exchanges = []
    for ex in exchanges:
        simple_exchanges.append({
            'name': ex.get('name'),
            'lat': ex.get('lat'),
            'lng': ex.get('lng')
        })
    return jsonify(simple_exchanges)

if __name__ == '__main__':
    app.run(debug=True)
