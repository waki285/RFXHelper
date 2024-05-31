import { isIPAddress } from "../util";

class ProcessDialog extends OO.ui.ProcessDialog {
  public panel1?: OO.ui.PanelLayout;
  public panel2?: OO.ui.PanelLayout;
  // @ts-expect-error
  public stackLayout: OO.ui.StackLayout = this.stackLayout;
  // @ts-expect-error
  public actions: OO.ui.ActionSet = this.actions;
  // @ts-expect-error
  public $body: JQuery<HTMLElement> = this.$body;

  public radioDorUD?: OO.ui.RadioSelectWidget;
  public sectionName?: OO.ui.TextInputWidget;
  public usernames?: OO.ui.TextInputWidget[];
  public inputReason?: OO.ui.MultilineTextInputWidget;
  public previewHtml?: string;

  constructor(config: OO.ui.Window.ConfigOptions) {
    super(config);
  }

  initialize() {
    super.initialize();

    this.panel1 = new OO.ui.PanelLayout({ padded: true, expanded: false });
    this.panel1.$element.append(
      "<p><strong>Welcome to RFXHelper!</strong> Assist in sending a global (un)(b)lock request.</p>"
    );

    const optionLock = new OO.ui.RadioOptionWidget({
      data: "lock",
      label: "Global (b)lock",
    });
    const optionUnlock = new OO.ui.RadioOptionWidget({
      data: "unlock",
      label: "Global un(b)lock",
    });
    this.radioDorUD = new OO.ui.RadioSelectWidget({
      items: [optionLock, optionUnlock],
    });

    this.radioDorUD.selectItem(optionLock);

    const typeField = new OO.ui.FieldLayout(this.radioDorUD, {
      label: "What would you like to request?",
      align: "top",
    });

    this.panel1.$element.append(typeField.$element);

    this.sectionName = new OO.ui.TextInputWidget({
      placeholder: "e.g. Global lock for BadUser123",
      required: true,
    });

    const sectionField = new OO.ui.FieldLayout(this.sectionName, {
      label: "What should the section name be?",
      align: "top",
    });

    this.panel1.$element.append(sectionField.$element);

    const un1 = new OO.ui.TextInputWidget({
      placeholder: "e.g. BadUser123, 127.0.0.1, 2001:db8::1, 127.0.0.2/30",
      required: true,
    });

    this.usernames = [un1];

    const usernameField = new OO.ui.FieldLayout(un1, {
      label:
        "Please enter the username, IP address, or CIDR range of the user you would like to request a global (un)(b)lock for.",
      align: "top",
    });

    usernameField.$element.css("margin-bottom", "0.25rem");

    this.panel1.$element.append(usernameField.$element);

    const unArea = $("<div>");

    this.panel1.$element.append(unArea);

    const addBtn = new OO.ui.ButtonWidget({
      label: "Add another",
    });

    addBtn.on("click", () => {
      const un = new OO.ui.TextInputWidget({
        placeholder: "e.g. BadUser123, 127.0.0.1, 2001:db8::1, 127.0.0.2/30",
        required: false,
        id: `un${this.usernames!.length}`,
      });
      const deleteBtn = new OO.ui.ButtonWidget({
        icon: "trash",
        flags: ["destructive"],
      });
      const div = $("<div>").css("display", "flex");
      deleteBtn.on("click", () => {
        div.remove();
        this.usernames = this.usernames!.filter((u) => u.$element.attr("id") !== un.$element.attr("id"));
      });
      deleteBtn.$element.css("flex-shrink", "0");
      un.$element.css("margin-right", "0");
      un.$element.css("margin-bottom", "0.25rem");

      this.usernames!.push(un);

      div.append(un.$element);
      div.append(deleteBtn.$element);
      unArea.append(div);
    });

    this.panel1.$element.append(addBtn.$element);

    this.inputReason = new OO.ui.MultilineTextInputWidget({
      placeholder: "e.g. Cross-wiki vandalism, Long-term abuse, etc.",
      required: true,
    });

    const reasonField = new OO.ui.FieldLayout(this.inputReason, {
      label: "What is the reason for the request?",
      align: "top",
    });

    this.panel1.$element.append(reasonField.$element);

    /*this.panel1.$element.append(
      "<p>If you wish to have a wiki with multiple active contributors deleted, you must hold a local discussion beforehand and consensus must be in favor of the wiki closing.</p>"
    );*/

    this.panel2 = new OO.ui.PanelLayout({ padded: true, expanded: false });
    this.stackLayout = new OO.ui.StackLayout({
      items: [this.panel1, this.panel2],
    });
    this.$body.append(this.stackLayout.$element);
    return this;
  }

  getRequestContent() {
    const dorud = (
      this.radioDorUD!.findSelectedItem() as OO.ui.OptionWidget
    ).getData();
    const reason = this.inputReason!.getValue();
    const usernames = this.usernames!.map((un) => un.getValue());
    const sectionName = this.sectionName!.getValue();

    const isAllNotIP = usernames.every((un) => {
      return !isIPAddress(un);
    });

    return {
      section: sectionName,
      text: `{{status}}\n${
        isAllNotIP && usernames.length > 3 ? 
        `{{MultiLock|${usernames.join("|")}}}` :
        `${
          usernames.map((un) => {
            return `* {{${isIPAddress(un) ? "Luxotool":"LockHide"}|${un}}}`;
          }).join("\n")
        }\n${reason}`
      }`,
      summary: `Requesting ${dorud} of ${
        usernames.length > 1 ? `${usernames.length} users` : usernames[0]
      } ([[Help:RFXHelper|RFXHelper]])`,
    };
  }

  getSetupProcess(data: OO.ui.Dialog.SetupDataMap & Record<string, any>) {
    return super.getSetupProcess.call(this, data).next(() => {
      this.actions.setMode("edit");
    }, this);
  }

  preview() {
    const content = this.getRequestContent();
    const api = new mw.Api();
    return api
      .post({
        action: "discussiontoolspreview",
        format: "json",
        // @ts-expect-error
        formatversion: "2",
        uselang: mw.config.get("wgUserLanguage") || "en",
        type: "topic",
        page: "Steward_requests/Global",
        wikitext: content.text,
        sectiontitle: content.section,
        useskin: mw.config.get("skin"),
        mobileformat: mw.config.get("skin") === "minerva",
      })
      .promise();
  }

  submit() {
    const content = this.getRequestContent();
    const api = new mw.Api();
    return api
      .postWithEditToken({
        action: "discussiontoolsedit",
        format: "json",
        // @ts-expect-error
        formatversion: "2",
        uselang: "ja",
        paction: "addtopic",
        useskin: mw.config.get("skin"),
        mobileformat: mw.config.get("skin") === "minerva",
        errorformat: "html",
        errorlang: mw.config.get("wgUserLanguage") || "en",
        errorsuselocal: true,
        page: "Steward_requests/Global",
        commentname: null,
        dtenable: "1",
        dttags: "discussiontools,discussiontools-newtopic",
        wikitext: content.text,
        sectiontitle: content.section,
        allownosectiontitle: true,
        summary: content.summary,
        autosubscribe: "yes",
      })
      .promise();
  }

  checkInputs() {
    const reason = this.inputReason!.getValue();
    const sectionName = this.sectionName!.getValue();
    const username1 = this.usernames![0]!.getValue();

    if (!username1 || !sectionName || !reason) {
      return false;
    }

    return true;
  }

  getActionProcess(action: string) {
    if (action === "preview") {
      if (!this.checkInputs()) {
        mw.notify("Please fill in all the required fields.", { type: "error" });
        return new OO.ui.Process(() => {});
      }
      return new OO.ui.Process(() => {
        return this.preview().then((data) => {
          const html = data.discussiontoolspreview.parse.text;
          const jsconfigvars = data.discussiontoolspreview.parse.jsconfigvars;
          if (jsconfigvars) {
            mw.config.set(jsconfigvars);
          }
          this.previewHtml = html;
          this.panel2!.$element.html(html);
          this.actions.setMode("preview");
          this.stackLayout.setItem(this.panel2!);
        });
      });
    } else if (action === "back") {
      this.actions.setMode("edit");
      this.stackLayout.setItem(this.panel1!);
    } else if (action === "continue") {
      if (!this.checkInputs()) {
        mw.notify("Please fill in all the required fields.", { type: "error" });
        return new OO.ui.Process(() => {});
      }
      return new OO.ui.Process(() => {
        return this.submit().then(() => {
          mw.notify("Request submitted successfully.", { type: "success" });
          this.close();
          location.reload();
        });
      });
    }
    return super.getActionProcess.call(this, action);
  }

  getBodyHeight() {
    return this.panel1!.$element.outerHeight(true)!;
  }

  static get static() {
    return {
      ...OO.ui.ProcessDialog.static,
      name: "rfxHelperUD",
      title: "RFXHelper - Global",
      actions: [
        {
          action: "continue",
          modes: ["edit"],
          label: "Submit",
          flags: ["primary", "destructive"],
        },
        {
          action: "preview",
          modes: ["edit"],
          label: "Preview",
          flags: ["progressive"],
        },
        {
          modes: ["edit"],
          label: "Cancel",
          flags: ["safe", "close"],
        },
        {
          action: "back",
          modes: ["preview"],
          label: "Back",
          flags: ["safe", "back"],
        },
      ],
    };
  }
}

export async function initGlobal() {
  const container = document.getElementById("rfxh-container");
  if (!container) {
    return;
  }

  container.style.display = "flex";
  container.style.justifyContent = "center";
  const a = document.createElement("a");
  a.textContent = "→ Request global (un)(b)lock with the tool";
  a.style.fontWeight = "bold";
  a.style.fontSize = "30px";
  a.href = "javascript:void(0);";
  container.appendChild(a);

  a.addEventListener("click", async () => {
    const windowManager = new OO.ui.WindowManager();
    $(document.body).append(windowManager.$element);

    const processDialog = new ProcessDialog({
      size: "medium",
    });

    windowManager.addWindows([processDialog]);
    windowManager.openWindow(processDialog);
  });
}
