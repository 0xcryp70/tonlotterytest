import pprint
from pymongo import MongoClient

# Initialize MongoDB client
client = MongoClient('mongodb://B14ckc0d3r:B14ckc0d3rSaeed@localhost:27017/admin')

# Select the database and specific collection
db = client['lottery']
collection = db['user_data']  # Replace with your specific collection name

# Retrieve all telegramIds
#telegram_ids = [user['telegramId'] for user in collection.find({}, {'_id': 0, 'telegramId': 1})]
telegram_ids = [int(user['telegramId']) for user in collection.find({}, {'_id': 0, 'telegramId': 1})]

# Pretty-print the full list of telegramIds
pprint.pprint(telegram_ids)

