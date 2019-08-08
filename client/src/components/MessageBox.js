export const MessageBox = {
  props: [
    "messages",
    'onSendMessage',
    'onTyping',
    'recipientTyping',
    'recipientName'
  ],
  computed: {
    submitDisabled() {
      return this.text === ''
    }
  },
  data() {
    return {
      text: '',
      typing: '',
      typingTimeout: null
    }
  },
  methods: {
    onKeyUp(e) {
      if (e.which === 13) {
        this.sendMessage(this.text)
        return false
      } else {
        this.startTyping()
        return true
      }
    },
    startTyping() {
      if (!this.typing) {
        this.onTyping()
        this.typing = true
        setTimeout(() => {
          this.typing = false
        }, 1000)
      }
    },
    sendMessage() {
      this.onSendMessage(this.text)
      this.text = ''
    }
  },
  template: `
    <div>
      <textarea v-model.trim="text" @keyup="onKeyUp" /> &nbsp;<button @click="sendMessage" :disabled="submitDisabled">Send</button>
      <div v-if="recipientTyping"><small>{{recipientName}} is typing...</small></div>
      <ul style="list-style: none;padding: 0">
        <li class="message-item" v-for="m in messages">{{ m.text }}</li>
      </ul>
    </div>`
}
