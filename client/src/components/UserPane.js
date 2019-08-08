import {MessageBox} from "./MessageBox.js"
import {UserAPIClient} from "../api/UserAPIClient.js"
import {UserPusherClient} from "../pusher/UserPusherClient.js"

export const UserPane = {
  props: [
    'id',
    'name',
    'sessionToken'
  ],
  components: {
    'message-box': MessageBox
  },
  data() {
    return {
      connected: false,
      messages: [],
      operatorTyping: false,
      operatorTypingTimeout: null,
      apiClient: new UserAPIClient(this.sessionToken),
      pusher: new UserPusherClient(this.id, this.sessionToken)
    }
  },
  computed: {
    submitDisabled() {
      return this.text === ''
    }
  },
  methods: {
    toggleConnection() {
      if (this.connected) {
        this.pusher.disconnect()
        this.connected = false
      } else {
        this.pusher.connect(() => this.connected = true, this.appendMessage, this.onOperatorTyping)
      }
    },
    appendMessage(message) {
      clearTimeout(this.operatorTypingTimeout)
      this.operatorTyping = false
      this.messages.push(message)
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
    onMeTyping() {
      this.pusher.triggerTypingEvent()
    },
    sendMessage(text) {
      this.apiClient.sendMessage(text)
    }
  },
  template: `
    <div>
      <strong>{{name}}</strong> &nbsp;<button v-on:click="toggleConnection">{{connected ? 'Leave' : 'Join'}}</button>
      <message-box v-if="connected"
                   :messages="messages"
                   :onSendMessage="sendMessage"
                   :onTyping="onMeTyping"
                   :recipientName="'Operator'"
                   :recipientTyping="operatorTyping"
      ></message-box> 
    </div>`
}
