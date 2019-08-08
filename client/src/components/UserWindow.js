import {MessageItem} from "./MessageItem.js"
import {APIClient} from "../APIClient.js"
import {UserPusherClient} from "../UserPusherClient.js"

export const UserWindow = {
  props: [
    'id',
    'name',
    'sessionToken'
  ],
  components: {
    'message-item': MessageItem
  },
  data() {
    return {
      connected: false,
      messages: [],
      text: '',
      operatorTyping: false,
      operatorTypingTimeout: null,
      typing: false,
      apiClient: new APIClient(this.sessionToken),
      pusher: new UserPusherClient(this.id, this.sessionToken)
    }
  },
  computed: {
    submitDisabled() {
      return this.text === ''
    }
  },
  methods: {
    appendMessage(message) {
      clearTimeout(this.operatorTypingTimeout)
      this.operatorTyping = false
      this.messages.push(message)
    },
    startTyping() {
      if (!this.typing) {
        this.pusher.triggerTypingEvent()
        this.typing = true
        setTimeout(() => {
          this.typing = false
        }, 1000)
      }
    },
    onKeyUp(e) {
      if (e.which === 13) {
        this.sendMessage()
        return false
      } else {
        this.startTyping()
        return true
      }
    },
    toggleConnection() {
      if (this.connected) {
        this.pusher.disconnect()
        this.connected = false
      } else {
        this.pusher.connect(() => this.connected = true, this.appendMessage, this.onOperatorTyping)
      }
    },
    onOperatorTyping() {
      if (!this.operatorTyping)
        this.operatorTyping = true
      if (this.operatorTypingTimeout != null) {
        clearTimeout(this.operatorTypingTimeout)
      }
      this.operatorTypingTimeout = setTimeout(() => {
        this.operatorTyping = false
      }, 1500)
    },
    sendMessage() {
      this.apiClient.sendMessage(this.text)
      this.text = ''
    }
  },
  template: `
    <div>
      <span>
        <strong>{{ name }}</strong> &nbsp;<button v-on:click="toggleConnection">{{connected ? 'Leave' : 'Join'}}</button>
      </span>
      <div v-if="connected">
        <textarea v-model.trim="text" @keyup="onKeyUp" /> &nbsp;<button @click="sendMessage" :disabled="submitDisabled">Send</button>
        <div v-if="operatorTyping"><small>Operator is typing...</small></div>
        <ul style="list-style: none;padding: 0">
          <message-item class="message-item"
                        v-for="(item, index) in messages"
                        :message="item"
                        :key="index"
          ></message-item>
        </ul>
      </div>
    </div>`
}
