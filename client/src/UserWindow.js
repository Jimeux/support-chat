import {MessageItem} from "./MessageItem.js"

// todo refactor this like AdminWindow

export const UserWindow = {
  props: [
    'id',
    'name',
    'sessionToken'
  ],
  computed: {
    submitDisabled() {
      return this.text === ''
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
    </div>
  `,
  components: {
    'message-item': MessageItem
  },
  data() {
    return {
      connected: false,
      messages: [],
      pusher: null,
      text: '',
      operatorTyping: false,
      operatorTypingTimeout: null,
      typing: false,
      myChannel: null
    }
  },
  methods: {
    appendMessage(message) {
      clearTimeout(this.operatorTypingTimeout)
      this.operatorTyping = false
      this.messages.push(message)
    },
    startTyping() {
      if (this.myChannel != null && !this.typing) {
        this.myChannel.trigger('client-user-typing', {userId: this.id})
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
        this.pusher = null
        this.connected = false
      } else {
        this.connect()
      }
    },
    sendMessage() {
      const url = '/message'
      const data = {text: this.text}

      fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
          'Session-Token': this.sessionToken
        }
      }).catch(error => console.error('Error:', error))
      this.text = ''
    },
    connect() {
      this.pusher = new Pusher('655a7bd7ad1d119d0d4d', {
        auth: {
          headers: {
            'Session-Token': this.sessionToken
          }
        },
        cluster: 'ap3',
        forceTLS: true
      })
      const room = this.pusher.subscribe('presence-channel')
      room.bind('pusher:subscription_succeeded', members => {
        // const me = channel.members.me
        this.connected = true
      })

      this.myChannel = this.pusher.subscribe(`private-${this.id}`)
      this.myChannel.bind('operator-message', this.appendMessage)
      this.myChannel.bind('client-operator-typing', event => {
        if (!this.operatorTyping)
          this.operatorTyping = true
        if (this.operatorTypingTimeout != null) {
          clearTimeout(this.operatorTypingTimeout)
        }
        this.operatorTypingTimeout = setTimeout(() => {
          this.operatorTyping = false
        }, 1500)
      })
    }
  }
}
