import {MessageBox} from "./MessageBox.js"

export const UserItem = {
  props: [
    'sendMessage',
    'startTyping',
    'toggleConnection',
    'user',
  ],
  components: {
    'message-box': MessageBox
  },
  methods: {
    onSendMessage(text) {
      this.sendMessage(this.user.id, text)
    },
    onTyping() {
      this.startTyping(this.user.id)
    }
  },
  template: `
    <li>
      {{user.name}} &nbsp;<button @click="toggleConnection(user.id)">{{user.connected ? 'Disconnect' : 'Connect'}}</button>
      <message-box v-if="user.connected"
                   :messages="user.messages"
                   :onSendMessage="onSendMessage"
                   :onTyping="onTyping"
                   :recipientName="user.name"
                   :recipientTyping="user.typing"
      ></message-box>
    </li>`
}
