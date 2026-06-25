import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatRoom, Message


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'
        self.user = self.scope['user']

        if not self.user.is_authenticated:
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        content = data.get('content', '').strip()
        if not content:
            return

        message = await self.save_message(content)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'id': message.id,
                'content': message.content,
                'sender_id': self.user.id,
                'sender_username': self.user.username,
                'sender_avatar': await self.get_avatar_url(self.user),
                'created_at': message.created_at.isoformat(),
            }
        )
        
        # Trigger bot reply if applicable
        await self.handle_bot_reply(content)

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))
        
    async def handle_bot_reply(self, user_message):
        bot_user = await self.get_bot_participant()
        if not bot_user or self.user.is_bot:
            return
            
        import asyncio
        await asyncio.sleep(1.5)  # Simulate typing delay
        
        reply_content = await self.generate_bot_response(bot_user, user_message)
        bot_message = await self.save_bot_message(bot_user, reply_content)
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'id': bot_message.id,
                'content': bot_message.content,
                'sender_id': bot_user.id,
                'sender_username': bot_user.username,
                'sender_avatar': await self.get_avatar_url(bot_user),
                'created_at': bot_message.created_at.isoformat(),
            }
        )

    @database_sync_to_async
    def get_bot_participant(self):
        room = ChatRoom.objects.get(id=self.room_id)
        return room.participants.filter(is_bot=True).exclude(id=self.user.id).first()
        
    @database_sync_to_async
    def generate_bot_response(self, bot_user, user_message):
        msg_lower = user_message.lower()
        if bot_user.bot_type == 'friendly':
            if 'привіт' in msg_lower:
                return 'Привіт! Як твій день?'
            return 'Звучить цікаво! Розкажи більше. 😊'
        elif bot_user.bot_type == 'joker':
            import random
            jokes = [
                'Чому програмісти плутають Хелловін та Різдво? Тому що 31 OCT = 25 DEC. 😂',
                'Скільки програмістів потрібно, щоб вкрутити лампочку? Жодного, це апаратна проблема!',
                'Баг — це не помилка, це недокументована фіча!'
            ]
            return random.choice(jokes)
        elif bot_user.bot_type == 'philosopher':
            if '?' in msg_lower:
                return 'Питання важливіші за відповіді. Але чи маємо ми вибір?'
            return 'Усе в цьому світі плинне. Навіть цей код.'
            
        return 'Я просто бот і поки що вчуся розуміти людей.'

    @database_sync_to_async
    def save_message(self, content):
        room = ChatRoom.objects.get(id=self.room_id)
        return Message.objects.create(room=room, sender=self.user, content=content)
        
    @database_sync_to_async
    def save_bot_message(self, bot_user, content):
        room = ChatRoom.objects.get(id=self.room_id)
        return Message.objects.create(room=room, sender=bot_user, content=content)

    @database_sync_to_async
    def get_avatar_url(self, user):
        if user.avatar:
            return user.avatar.url
        return None
