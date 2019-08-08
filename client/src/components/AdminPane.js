import {UserItem} from "./UserItem.js"
import {AdminPusherClient} from "../pusher/AdminPusherClient.js"
import {AdminAPIClient} from "../api/AdminAPIClient.js"

export const AdminPane = {
  props: [
    'name',
    'sessionToken'
  ],
  components: {
    'user-item': UserItem,
  },
  data() {
    return {
      connected: false,
      apiClient: new AdminAPIClient(this.sessionToken),
      pusher: new AdminPusherClient(this.sessionToken),
      users: []
    }
  },
  methods: {
    toggleConnection() {
      if (this.connected) {
        this.pusher.disconnect()
        this.users = []
      } else {
        this.pusher.connect(this.addAllUsers, this.addUser, this.removeUser)
      }
      this.connected = !this.connected
    },
    toggleUserConnection(id) {
      const ids = this.pusher.toggleUserConnection(id, this.appendMessage, this.onClientTyping)
      this.users.forEach(u => u.connected = ids.includes(u.id))
    },
    addAllUsers(users) {
      users.forEach(this.addUser)
    },
    addUser(user) {
      this.users.push(user)
    },
    removeUser(user) {
      const index = this.users.findIndex(u => u.id === user.id)
      this.$delete(this.users, index)
    },
    appendMessage(message) {
      // todo validation
      const index = this.users.findIndex(u => u.id === message.userId)
      const user = this.users[index]

      user.messages.push(message)
      user.typing = false
      clearTimeout(user.typingTimeout)
    },
    sendResponse(userId, text) {
      this.apiClient.sendResponse(userId, text)
    },
    onClientTyping(event) {
      // todo validation
      const index = this.users.findIndex(u => u.id === event.userId)
      const user = this.users[index]

      if (!user.typing)
        user.typing = true

      if (user.typingTimeout != null)
        clearTimeout(user.typingTimeout)

      user.typingTimeout = setTimeout(() => {
        user.typing = false
      }, 1500)
    },
    startTyping(userId) {
      const index = this.users.findIndex(u => u.id === userId)
      if (index < 0 || !this.users[index] || this.users[index].beingTyped)
        return

      const user = this.users[index]

      this.pusher.triggerTypingEvent(userId)
      user.beingTyped = true
      setTimeout(() => {
        // todo check not null
        user.beingTyped = false
      }, 1000)
    }
  },
  template: `
    <div>
      <strong>{{ name }}</strong> &nbsp;<button @click="toggleConnection">{{connected ? 'Leave' : 'Join'}}</button>
      <ul style="list-style: none;padding: 0">
        <user-item class="user-item"
                   v-for="(item, index) in users"
                   :key="index"
                   :user="item"
                   :sendMessage="sendResponse"
                   :startTyping="startTyping"
                   :toggleConnection="toggleUserConnection"
        ></user-item>
      </ul>
    </div>`
}
