import {UserPane} from "./components/UserPane.js"
import {AdminPane} from "./components/AdminPane.js"

const app = new Vue({
  el: '#app',
  components: {
    'admin-pane': AdminPane,
    'user-pane': UserPane
  },
  template: `
    <div>
      <div style="float: left; width: 50%">
        <admin-pane class="pane" name="Admin" sessionToken="423456789"></admin-pane>
      </div>
      <div style="float: left; width: 50%">
        <user-pane class="pane" id="1" name="James" sessionToken="123456789"></user-pane>
        <user-pane class="pane" id="2" name="Shin" sessionToken="223456789"></user-pane>
        <user-pane class="pane" id="3" name="Emmanuel" sessionToken="323456789"></user-pane> 
      </div>
    </div>
  `
})
