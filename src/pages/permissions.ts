function getSections(): JQuery.Promise<{ index: string; line: string }[]> {
  return new mw.Api()
    .get({
      action: "parse",
      format: "json",
      // @ts-expect-error
      formatversion: "2",
      page: "Steward_requests/Permissions",
      prop: "sections",
    })
    .then((data) => {
      return data.parse.sections;
    })
    .promise();
}

const SECTION_NAMES = new Map([
  ["admin", "Administrator/Bureaucrat access"],
  ["small", "Other access"],
  ["resign", "Removal"],
  ["remove", "Removal"],
  ["gipbe", "Other access"],
  ["mistake", "Administrator/Bureaucrat access"],
]);

class ProcessDialog extends OO.ui.ProcessDialog {
  public panel1?: OO.ui.PanelLayout;
  public panel2?: OO.ui.PanelLayout;
  public panelG?: OO.ui.PanelLayout;
  // @ts-expect-error
  public stackLayout: OO.ui.StackLayout = this.stackLayout;
  // @ts-expect-error
  public actions: OO.ui.ActionSet = this.actions;
  // @ts-expect-error
  public $body: JQuery<HTMLElement> = this.$body;

  public radioAction?: OO.ui.RadioSelectWidget;
  public inputSubdomain?: OO.ui.TextInputWidget;
  public inputUsername?: OO.ui.TextInputWidget;
  public inputReason?: OO.ui.MultilineTextInputWidget;
  public inputDiscussion?: OO.ui.TextInputWidget;
  public previewHtml?: string;
  public state = "action";

  public fields: OO.ui.FieldLayout[] = [];

  constructor(config: OO.ui.Window.ConfigOptions) {
    super(config);
  }

  initialize() {
    super.initialize();

    this.panel1 = new OO.ui.PanelLayout({ padded: true, expanded: false });
    this.panel1.$element.append(
      "<p><strong>Welcome to RFXHelper!</strong> Assist in sending a request about permissions.</p>"
    );

    const optionAdmin = new OO.ui.RadioOptionWidget({
      data: "admin",
      label: "Request an administrator or bureaucrat on a specific wiki",
    });
    const optionSmall = new OO.ui.RadioOptionWidget({
      data: "small",
      label:
        "Request small permissions such as autopatrolled or rollbacker on specific wikis",
    });
    const optionResign = new OO.ui.RadioOptionWidget({
      data: "resign",
      label: $("<span>").html(
        "Request to remove <b>my</b> permissions on a specific wiki"
      ),
    });
    const optionRemove = new OO.ui.RadioOptionWidget({
      data: "remove",
      label: "Request to remove someone else's permissions on a specific wiki",
    });
    const optionGIPBE = new OO.ui.RadioOptionWidget({
      data: "gipbe",
      label: "Request global IP block exemption",
    });
    const optionMistake = new OO.ui.RadioOptionWidget({
      data: "mistake",
      label: "I lost my own permissions by mistake",
    });

    this.radioAction = new OO.ui.RadioSelectWidget({
      items: [
        optionAdmin,
        optionSmall,
        optionResign,
        optionRemove,
        optionGIPBE,
        optionMistake,
      ],
    });

    this.radioAction.selectItem(optionAdmin);

    const typeField = new OO.ui.FieldLayout(this.radioAction, {
      label: "What would you like to request?",
      align: "top",
    });

    this.panel1.$element.append(typeField.$element);

    this.inputSubdomain = new OO.ui.TextInputWidget({
      placeholder: "e.g. test",
      required: true,
    });
    const inputButton = new OO.ui.ButtonWidget({
      label: ".miraheze.org",
      tabIndex: -1,
    });
    this.inputSubdomain.$element.css("margin-right", "0");

    const metaError = new OO.ui.MessageWidget({
      type: "error",
      inline: true,
      label: $("<span>").html(
        `Do not request Meta permissions here! Instead, go to <a href="//meta.miraheze.org/wiki/Meta:Requests_for_permissions">Requests for permissions</a>.`
      ),
    });
    metaError.$element.css("display", "none");
    metaError.$element.css("margin-top", "5px");

    this.inputSubdomain.on("change", (e) => {
      const value = this.inputSubdomain!.getValue();
      const action = (
        this.radioAction!.findSelectedItem() as OO.ui.OptionWidget
      ).getData();
      if (action === "admin" || action === "small") {
        if (value === "meta") {
          metaError.$element.css("display", "block");
        } else {
          metaError.$element.css("display", "none");
        }
      }
    });

    const subdomainField = new OO.ui.FieldLayout(this.inputSubdomain, {
      label:
        "What is the subdomain of the wiki for which you want to request it?",
      align: "top",
      id: "subdomainField",
    });
    subdomainField.$field.append(inputButton.$element);
    subdomainField.$field.css("display", "flex");
    subdomainField.$element.append(metaError.$element);

    this.inputUsername = new OO.ui.TextInputWidget({
      placeholder: "e.g. Example",
      required: true,
      value: mw.config.get("wgUserName")!,
    });

    const usernameField = new OO.ui.FieldLayout(this.inputUsername, {
      label:
        "What is the username of the user whose permissions you want to grant/revoke?",
      align: "top",
      id: "usernameField",
    });

    this.inputReason = new OO.ui.MultilineTextInputWidget({
      placeholder: "Please describe in detail why you are making this request.",
      required: true,
    });

    const reasonField = new OO.ui.FieldLayout(this.inputReason, {
      label: "What is the reason for the request?",
      align: "top",
    });

    reasonField.$field.prepend($("<p>").attr("id", "disc").text("If you have a discussion, please write it in the text box below, not here."));

    this.inputDiscussion = new OO.ui.TextInputWidget({
      placeholder:
        "e.g. https://example.miraheze.org/wiki/Project:Village_pump",
    });

    const discussionField = new OO.ui.FieldLayout(this.inputDiscussion, {
      label: "If there is any discussion on this, please add a link.",
      align: "top",
      id: "discussionField",
    });

    this.panelG = new OO.ui.PanelLayout({ padded: true, expanded: false });

    this.panelG!.$element.append(
      $("<p>")
        .attr("id", "g1")
        .text("Request an administrator or bureaucrat on a specific wiki."),
      subdomainField.$element,
      usernameField.$element,
      reasonField.$element,
      discussionField.$element,
      $("<p>").attr("id", "g1_2").text("")
    );

    this.panel2 = new OO.ui.PanelLayout({ padded: true, expanded: false });

    this.stackLayout = new OO.ui.StackLayout({
      items: [this.panel1, this.panel2, this.panelG],
    });
    this.$body.append(this.stackLayout.$element);

    return this;
  }

  getRequestContent() {
    const action = (
      this.radioAction!.findSelectedItem() as OO.ui.OptionWidget
    ).getData();
    let subdomain = this.inputSubdomain!.getValue();
    let username = this.inputUsername!.getValue();
    const reason = this.inputReason!.getValue();
    const discussion = this.inputDiscussion!.getValue();

    if (action === "resign" || action === "mistake") {
      username = mw.config.get("wgUserName")!;
    }
    if (action === "gipbe") {
      subdomain = "global";
    }

    return {
      section: `${username}@${action === "gipbe" ? "global" : `${subdomain}wiki`}`,
      text: `{{Permission request\n|status = \n|wiki = ${subdomain}\n|user name = ${username || mw.config.get("wgUserName")}\n${discussion ? `|discussion = ${discussion}\n` : ""}}}\n${reason} --~~~~`,
      summary:
        (action === "gipbe"
          ? `Requesting GIPBE for ${username}`
          : `Requesting ${action} for ${username || mw.config.get("wgUserName")} on ${subdomain}wiki`) +
        " ([[Help:RFXHelper|RFXHelper]])",
    };
  }

  getSetupProcess(data: OO.ui.Dialog.SetupDataMap & Record<string, any>) {
    return super.getSetupProcess.call(this, data).next(() => {
      this.actions.setMode("action");
    }, this);
  }

  preview() {
    const content = this.getRequestContent();
    const api = new mw.Api();
    return api
      .post({
        action: "parse",
        format: "json",
        // @ts-expect-error
        title: "Steward requests/Permissions",
        text: `=== ${content.section} ===\n${content.text}`,
        summary: content.summary,
        prop: "text|modules|jsconfigvars",
        pst: 1,
        disablelimitreport: 1,
        disableeditsection: 1,
        preview: 1,
        sectionpreview: 1,
        disabletoc: 1,
        formatversion: "2",
        useskin: mw.config.get("skin"),
        mobileformat: mw.config.get("skin") === "minerva",
      })
      .promise();
  }

  submit() {
    const content = this.getRequestContent();
    const sections = getSections();
    const action = (
      this.radioAction!.findSelectedItem() as OO.ui.OptionWidget
    ).getData();
    const sectionName = SECTION_NAMES.get(action as string)!;
    const section = sections.then((sections) => {
      return sections.find((section) => section.line === sectionName);
    });
    return section.then((s) => {
      const api = new mw.Api();
      return api.postWithEditToken({
        action: "edit",
        // @ts-expect-error
        formatversion: "2",
        section: s?.index,
        title: "Steward_requests/Permissions",
        nocreate: 1,
        appendtext: `\n=== ${content.section} ===\n${content.text}`,
        summary: content.summary,
      });
    }).promise();
  }

  checkInputs() {
    const subdomain = this.inputSubdomain!.getValue();
    const username = this.inputUsername!.getValue();
    const reason = this.inputReason!.getValue();

    const action = (
      this.radioAction!.findSelectedItem() as OO.ui.OptionWidget
    ).getData();

    let result = true;

    if (action === "admin" || action === "small") {
      if (subdomain === "meta") {
        result = false;
      }
      if (!subdomain || !username || !reason) {
        result = false;
      }
    } else if (action === "resign" || action === "remove") {
      if (!subdomain || !reason) {
        result = false;
      }
    } else if (action === "gipbe") {
      if (!reason) {
        result = false;
      }
    } else if (action === "mistake") {
      if (!reason) {
        result = false;
      }
    }

    return result;
  }

  getActionProcess(action: string) {
    /*if (action === "preview") {
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
      this.actions.setMode("action");
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
    }*/
    if (action === "preview") {
      console.log("preview");
      if (!this.checkInputs()) {
        mw.notify("Please fill in all the required fields.", { type: "error" });
        return new OO.ui.Process(() => {});
      }
      return new OO.ui.Process(() => {
        return this.preview().then((data) => {
          const html = data.parse.text;
          const jsconfigvars = data.parse.jsconfigvars;
          if (jsconfigvars) {
            mw.config.set(jsconfigvars);
          }
          this.previewHtml = html;
          this.state = "preview";
          this.panel2!.$element.html(html);
          this.actions.setMode("preview");
          this.stackLayout.setItem(this.panel2!);
        });
      });
    } else if (action === "submit") {
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
    } else if (action === "next") {
      if (this.state === "action") {
        const action = (
          this.radioAction!.findSelectedItem() as OO.ui.OptionWidget
        ).getData();
        $("#usernameField").css("display", "block");
        $("#discussionField").css("display", "block");
        $("#subdomainField").css("display", "block");
        $("#disc").css("display", "block");
        if (action === "admin") {
          $("#g1").html(
            "<p>Request an administrator or bureaucrat on a specific wiki.</p>"
          );
          $("#g1_2").html(
            '<p>If there are active contributors to the wiki, it may be necessary to hold <a href="//meta.miraheze.org/wiki/Local_elections">local elections</a>.</p>'
          );
          this.state = "general1";
          this.stackLayout.setItem(this.panelG!);
        } else if (action === "small") {
          $("#g1").html(
            "<p>Request small permissions such as autopatrolled or rollbacker on specific wikis.</p>"
          );
          this.state = "general1";
          this.stackLayout.setItem(this.panelG!);
        } else if (action === "resign") {
          $("#g1").html(
            "<p>Request to remove <b>my</b> permissions on a specific wiki.</p>"
          );
          this.state = "general1";
          this.stackLayout.setItem(this.panelG!);
          $("#usernameField").css("display", "none");
        } else if (action === "remove") {
          $("#g1").html(
            "<p>Request to remove someone else's permissions on a specific wiki.</p>"
          );
          this.state = "general1";
          this.stackLayout.setItem(this.panelG!);
        } else if (action === "gipbe") {
          $("#g1").html("<p>Request global IP block exemption</p>");
          this.state = "general1";
          this.stackLayout.setItem(this.panelG!);
          $("#subdomainField").css("display", "none");
          $("#discussionField").css("display", "none");
          $("#disc").css("display", "none");
        } else if (action === "mistake") {
          $("#g1").html(
            "<p>Don't worry! You can request restoration of permissions here.</p>"
          );
          this.state = "general1";
          this.stackLayout.setItem(this.panelG!);
          $("#usernameField").css("display", "none");
          $("#discussionField").css("display", "none");
          $("#disc").css("display", "none");
        }
        if (this.state === "general1") {
          this.actions.setMode("general1");
        }
      }
    } else if (action === "back") {
      if (this.state === "general1") {
        //this.panelG!.$element.eq(0).eq(0).remove();
        this.state = "action";
        this.stackLayout.setItem(this.panel1!);
        this.actions.setMode("action");
      } else if (this.state === "preview") {
        this.state = "general1";
        this.stackLayout.setItem(this.panelG!);
        this.actions.setMode("general1");
      }
    }
    return super.getActionProcess.call(this, action);
  }

  getBodyHeight() {
    return this.panel1!.$element.outerHeight(true)!;
  }

  static get static() {
    return {
      ...OO.ui.ProcessDialog.static,
      name: "rfxHelperPerm",
      title: "RFXHelper - Permissions",
      actions: [
        {
          action: "next",
          modes: ["action"],
          label: "Next",
          flags: ["primary", "progressive"],
        },
        {
          action: "preview",
          modes: ["general1"],
          label: "Preview",
          flags: ["progressive"],
        },
        {
          modes: ["action"],
          label: "Cancel",
          flags: ["safe", "close"],
        },
        {
          action: "back",
          modes: ["general1", "preview"],
          label: "Back",
          flags: ["safe", "back"],
        },
        {
          action: "submit",
          modes: ["general1"],
          label: "Submit",
          flags: ["primary", "destructive"],
        },
      ],
    };
  }
}

export async function initPermissions() {
  const container = document.getElementById("rfxh-container");
  if (!container) {
    return;
  }

  container.style.display = "flex";
  container.style.justifyContent = "center";
  const a = document.createElement("a");
  a.textContent = "→ Request about permissions with the tool";
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
