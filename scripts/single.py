import pprint
from pymongo import MongoClient
from telegram import Bot
from telegram.error import TelegramError

# Initialize MongoDB client
client = MongoClient('mongodb://B14ckc0d3r:B14ckc0d3rSaeed@localhost:27017/admin')

# Select the database and specific collection
db = client['lottery_test']  # Replace with your database name
collection = db['user_data']  # Replace with your specific collection name

# Retrieve all telegramIds and ensure they are integers
#telegram_ids = [int(user['telegramId']) for user in collection.find({}, {'_id': 0, 'telegramId': 1})]
test_telegram_id = 7116003536
# Your Telegram bot token
BOT_TOKEN = '6659754838:AAFXlmSjf1Ftu1tGG4I76saR_KyQ_NnWY_I'

# Initialize the bot
bot = Bot(token=BOT_TOKEN)

# The message you want to send
message_text = "Hello! This is a message from your bot."

# Function to send message to all users
def send_messages():
       try:
         bot.send_message(chat_id=test_telegram_id, text=message_text)
         print(f"Message sent to {test_telegram_id}")
       except TelegramError as e:
         print(f"Failed to send message to {test_telegram_id}: {e}")

# Send the messages
send_messages()





