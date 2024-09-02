import time
import requests
from pymongo import MongoClient

# Initialize MongoDB client
client = MongoClient('mongodb://B14ckc0d3r:B14ckc0d3rSaeed@localhost:27017/admin')

# Select the database and specific collection
db = client['lottery']  # Replace with your database name
collection = db['user_data']  # Replace with your specific collection name

# Retrieve all telegramIds and ensure they are integers
telegram_ids = [int(user['telegramId']) for user in collection.find({}, {'_id': 0, 'telegramId': 1})]

# Your Telegram bot token
BOT_TOKEN = '7173787325:AAGedFA4aDhhvIaxi0Q2BC_kygvuhhUNy5A'

# The Telegram API URL for sending messages
telegram_api_url = f'https://api.telegram.org/bot{BOT_TOKEN}/sendMessage'

# The message you want to send
message_text = "A major update is here! \n\nSeason One: Dragon Season! 🐲 🌟\n\nhttps://t.me/lotterytoncoin_bot/app"

# Function to send message to all users
def send_messages():
    for telegram_id in telegram_ids:
        try:
            response = requests.post(telegram_api_url, data={
                'chat_id': telegram_id,
                'text': message_text
            })

            # Print the response for debugging
            if response.status_code == 200:
                print(f"Message sent to {telegram_id}")
            else:
                print(f"Failed to send message to {telegram_id}: {response.status_code} {response.text}")

            # Wait 1 second between messages to respect rate limits
            time.sleep(0.5)

        except requests.exceptions.RequestException as e:
            print(f"Request failed for {telegram_id}: {e}")

# Send the messages
send_messages()

