import {MessageItem} from "./MessageItem.js"

export const UserItem = {
  props: [
    'sendMessage',
    'startTyping',
    'toggleConnection',
    'user',
  ],
  components: {
    'message-item': MessageItem,
  },
  data() {
    return {
      text: ''
    }
  },
  computed: {
    submitDisabled() {
      return this.text === ''
    }
  },
  methods: {
    triggerMessage() {
      this.sendMessage(this.user.id, this.text)
      this.text = ''
    },
    onKeyUp(e) {
      if (e.which === 13) {
        this.triggerMessage()
        return false
      } else {
        this.startTyping(this.user.id)
        return true
      }
    }
  },
  template: `
    <li>
      <span>{{ user.name }} &nbsp;<button @click="toggleConnection(user.id)">{{user.connected ? 'Disconnect' : 'Connect'}}</button>
        </span>
       <div v-if="user.connected">
        <br/>
        <textarea v-model.trim="text" @keyup="onKeyUp" /> &nbsp;<button @click="triggerMessage" :disabled="submitDisabled">Send</button>
        <div v-if="user.typing"><small>User is typing...</small></div>
        <ul style="list-style: none;padding: 0">
          <message-item class="message-item"
                        v-for="(item, index) in user.messages"
                        :message="item"
                        :key="index"
          ></message-item>
        </ul> 
      </div>
    </li>`
}
