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
  public inputSubdomain?: OO.ui.TextInputWidget;
  public inputWikiName?: OO.ui.TextInputWidget;
  public inputReason?: OO.ui.MultilineTextInputWidget;
  public inputDiscussion?: OO.ui.TextInputWidget;
  public previewHtml?: string;

  constructor(config: OO.ui.Window.ConfigOptions) {
    super(config);
  }

  initialize() {
    super.initialize();

    this.panel1 = new OO.ui.PanelLayout({ padded: true, expanded: false });
    this.panel1.$element.append(
      "<p><strong>Welcome to RFXHelper!</strong> Assist in sending a delete or undelete request.</p>"
    );

    const optionDeletion = new OO.ui.RadioOptionWidget({
      data: "deletion",
      label: "Wiki deletion",
    });
    const optionUndeletion = new OO.ui.RadioOptionWidget({
      data: "undeletion",
      label: "Wiki undeletion",
    });
    this.radioDorUD = new OO.ui.RadioSelectWidget({
      items: [optionDeletion, optionUndeletion],
    });

    this.radioDorUD.selectItem(optionDeletion);

    const typeField = new OO.ui.FieldLayout(this.radioDorUD, {
      label: "What would you like to request?",
      align: "top",
    });

    this.panel1.$element.append(typeField.$element);

    this.inputSubdomain = new OO.ui.TextInputWidget({
      placeholder: "e.g. meta",
      required: true,
    });
    const inputButton = new OO.ui.ButtonWidget({
      label: ".miraheze.org",
      tabIndex: -1,
    });
    this.inputSubdomain.$element.css("margin-right", "0");

    const subdomainField = new OO.ui.FieldLayout(this.inputSubdomain, {
      label:
        "What is the subdomain of the wiki for which you want to request it?",
      align: "top",
    });
    subdomainField.$field.append(inputButton.$element);
    subdomainField.$field.css("display", "flex");

    this.panel1.$element.append(subdomainField.$element);

    this.inputWikiName = new OO.ui.TextInputWidget({
      placeholder: "e.g. TestWiki",
      required: true,
    });

    const wikiNameField = new OO.ui.FieldLayout(this.inputWikiName, {
      label: "What is the name of the wiki?",
      align: "top",
    });

    this.panel1.$element.append(wikiNameField.$element);

    this.inputReason = new OO.ui.MultilineTextInputWidget({
      placeholder: "e.g. The deletion was decided by the community.",
      required: true,
    });

    const reasonField = new OO.ui.FieldLayout(this.inputReason, {
      label: "What is the reason for the request?",
      align: "top",
    });

    this.panel1.$element.append(reasonField.$element);

    this.inputDiscussion = new OO.ui.TextInputWidget({
      placeholder:
        "e.g. https://example.miraheze.org/wiki/Project:Village_pump",
    });

    const discussionField = new OO.ui.FieldLayout(this.inputDiscussion, {
      label: "If there is any discussion on this, please add a link.",
      align: "top",
    });

    this.panel1.$element.append(discussionField.$element);

    this.panel1.$element.append(
      "<p>If you wish to have a wiki with multiple active contributors deleted, you must hold a local discussion beforehand and consensus must be in favor of the wiki closing.</p>"
    );

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
    const subdomain = this.inputSubdomain!.getValue();
    const wikiName = this.inputWikiName!.getValue();
    const reason = this.inputReason!.getValue();
    const discussion = this.inputDiscussion!.getValue();

    return {
      section: wikiName,
      text: `{{SN wiki request\n|status = \n|request = ${dorud}\n|wiki = ${subdomain}\n|reason = ${reason} --~~~~\n|discussion = ${discussion}\n}}`,
      summary: `Requesting ${dorud} of ${wikiName} ([[Help:RFXHelper|RFXHelper]])`,
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
        page: "Steward_requests/(Un)deletions",
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
        page: "Steward_requests/(Un)deletions",
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
    const subdomain = this.inputSubdomain!.getValue();
    const wikiName = this.inputWikiName!.getValue();
    const reason = this.inputReason!.getValue();

    if (!subdomain || !wikiName || !reason) {
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
      title: "RFXHelper - (Un)deletions",
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

export async function initUD() {
  const container = document.getElementById("rfxh-container");
  if (!container) {
    return;
  }

  container.style.display = "flex";
  container.style.justifyContent = "center";
  const a = document.createElement("a");
  a.textContent = "→ Request (un)deletion with the tool";
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
