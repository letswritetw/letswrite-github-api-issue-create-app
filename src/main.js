import marked from 'marked'
import dayjs from 'dayjs'
import { Editor } from '@toast-ui/vue-editor';

const apiDemo = new Vue({
  el: '#app',
  data: {
    providerGithub: new firebase.auth.GithubAuthProvider(),
    configGet: null,
    anIssue: null,
    anIssueBody: '',
    anIssueComments: null,
    user: null, // 登入者的資料
    token: '', // 存 token
    afterLogin: false, // 是否 打開登入、刪除 的區塊

    // markdown editor options
    markdownOptions: {
      usageStatistics: false,
      toolbarItems: [
        'heading',
        'bold',
        'italic',
        'strike',
        'divider',
        'hr',
        'quote',
        'divider',
        'ul',
        'ol',
        'task',
        'divider',
        'table',
        'divider',
        'code',
        'codeblock'
      ]
    }
  },
  components: {
    editor: Editor
  },
  methods: {

    // Markdown 轉為 HTML
    markdownToHtml(input) {
      return marked(input)
    },

    // dayjs format 時間
    formatTime(time) {
      return dayjs(time).format('YYYY-MM-DD')
    },

    // GitHub 登入
    githubLogin() {
      firebase.auth()
        .signInWithPopup(this.providerGithub)
        .then(result => {
          let credential = result.credential;
          this.token = credential.accessToken;
          this.user = result.user;
          console.log("🚀 ~ user", this.user)
          this.afterLogin = true;
        }).catch(error => {
          throw error
        });
    },

    // GitHub 登出
    githubSignOut() {
      firebase.auth().signOut().then(() => {
        window.alert('登出成功，將重新整理一次頁面！');
        window.location.reload();
      }).catch(error => {
        throw error;
      });
    },

    // GitHub 刪除帳號
    deleteUser() {
      let user = firebase.auth().currentUser;
      if(user !== null) {
        user.delete().then(function() {
          window.alert('刪除成功，將重新整理一次頁面！');
          window.location.reload();
        }).catch(error => {
          throw error;
        });
      } else {
        window.alert('請重新登入會員，再執行刪除功能');
      }
    },

    // 取單個 Issue
    // https://docs.github.com/en/rest/reference/issues#get-an-issue
    getAnIssue() {
      fetch("https://api.github.com/repos/letswritetw/letswrite-github-api-issue-create-app/issues/2", this.configGet)
        .then(response => response.json())
        .then(result => {
          this.anIssue = result;
          this.anIssueBody = marked(this.anIssue.body);
        })
        .catch(error => console.log('error', error));
    },

    // 取單個 Issue 裡的所有 Comments
    // https://docs.github.com/en/rest/reference/issues#list-issue-comments
    getAnIssueComments() {
      fetch("https://api.github.com/repos/letswritetw/letswrite-github-api-issue-create-app/issues/2/comments", this.configGet)
        .then(response => response.json())
        .then(result => {
          this.anIssueComments = result;
        })
        .catch(error => console.log('error', error));
    },

    // 取 Markdown Editor Value
    getMarkdown() {
      return this.$refs.editor.invoke('getMarkdown');
    },

    // 送出留言
    submitComment() {
      let content = this.getMarkdown();
      if(content.trim().length <= 0) {
        window.alert('請填寫內容。')
        return false;
      } else {
        const apiUri = "https://api.github.com/repos/letswritetw/letswrite-github-api-issue-create-app/issues/2/comments";

        const headers = new Headers();
        headers.append("Accept", "application/vnd.github.v3+json");
        headers.append("Authorization", "Bearer " + this.token);
        headers.append("Content-Type", "application/json");

        let data = JSON.stringify({
          "body": content
        });

        let config = {
          method: 'POST',
          headers: headers,
          body: data,
          redirect: 'follow'
        };

        fetch(apiUri, config)
          .then(res => res.json())
          .then(result => {
            window.alert('送出成功，將重新整理頁面。')
            window.location.reload();
          })
          .catch(error => console.log('error', error));
        }
    }
  },
  created() {

    const headers = new Headers();
    headers.append("Accept", "application/vnd.github.v3+json");
    this.configGet = {
      method: 'GET',
      headers: headers,
      redirect: 'follow'
    }

    this.getAnIssue();
    this.getAnIssueComments();
  },
})