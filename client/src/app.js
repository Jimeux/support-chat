import {UserWindow} from "./UserWindow.js"
import {AdminWindow} from "./AdminWindow.js"

const app = new Vue({
  el: '#app',
  components: {
    'admin-window': AdminWindow,
    'user-window': UserWindow
  },
  template: `
    <div>
      <div style="float: left; width: 50%">
        <admin-window class="user-window" name="Admin" sessionToken="423456789"></admin-window>
      </div>
      <div style="float: left; width: 50%">
        <user-window class="user-window" id="1" name="James" sessionToken="123456789"></user-window>
        <user-window class="user-window" id="2" name="Shin" sessionToken="223456789"></user-window>
        <user-window class="user-window" id="3" name="Emmanuel" sessionToken="323456789"></user-window> 
      </div>
    </div>
  `
})
