export function isIPv4Address(ip: string) {
  return /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/.test(ip)
}

export function isIPv6Address(ip: string) {
  return /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))(\/((1(1[0-9]|2[0-8]))|([0-9][0-9])|([0-9])))?$/.test(ip)
}

export function isIPAddress(ip: string) {
  return isIPv4Address(ip) || isIPv6Address(ip)
}

export type ApiError = {
  captcha?: object;
  code?: string;
  html?: string;
  info?: string;
};

type ApiErrorResponse = {
  error?: ApiError;
  errors?: ApiError[];
};

type DiscussionToolsApiResponse = ApiErrorResponse & {
  discussiontoolsedit?: ApiError & {
    edit?: ApiError;
    errors?: ApiError[];
    result?: string;
  };
};

// Spaghetti from jswikibot. Whatever.
export function openWindow<T>(
  dialog: OO.ui.Dialog,
  data?: OO.ui.WindowManager.WindowOpeningData,
  closureCallback: (data: T) => void = () => {}
) {
  const windowManager = new OO.ui.WindowManager({
    classes: ["rfxhelper-window"],
  });
  $(document.body).append(windowManager.$element);
  windowManager.addWindows([dialog]);

  const opened = windowManager.openWindow(dialog, data);

  opened.closed.then((result: unknown) => {
    windowManager.$element.remove();
    windowManager.destroy();
    closureCallback(result as T);
  });
}

export function simpleAlert(title: string, message: string | JQuery) {
  const messageDialog = new OO.ui.MessageDialog();
  openWindow(messageDialog, {
    title,
    message,
    actions: [{ action: "ok", label: "OK", flags: ["primary", "safe"] }],
  });
}

export function showErrorDialog(message: string | JQuery) {
  simpleAlert("Error", message);
}

export function getApiErrorNotificationWithWikitext(error: ApiError | string | undefined, wikitext: string) {
  return getApiErrorNotification(error).append(
    $("<p>").text("The submitted source wikitext is below. You can copy and paste it into the source editor."),
    $("<textarea>")
      .val(wikitext)
      .attr("readonly", "readonly")
      .attr("rows", 12)
      .css({
        width: "100%",
        "box-sizing": "border-box",
        "font-family": "monospace",
      })
  );
}

type EditApiResponse = {
  edit: ApiError & {
    result: string;
  };
};

export function getEditApiError(response: EditApiResponse) {
  return response.edit.result === "Success" ? null : response.edit;
}

function getApiErrorFromResponse(response?: ApiErrorResponse) {
  return response?.error || response?.errors?.[0];
}

export function getDiscussionToolsApiError(response?: DiscussionToolsApiResponse) {
  const discussionToolsEdit = response?.discussiontoolsedit;

  if (discussionToolsEdit?.result === "success") {
    return null;
  }

  return (
    discussionToolsEdit?.edit ||
    discussionToolsEdit?.errors?.[0] ||
    getApiErrorFromResponse(response)
  );
}

export function getApiErrorNotification(error?: ApiError | string) {
  console.error(error);
  const apiError = typeof error === "string" ? { info: error } : error || {};
  const $message = $("<span>").append(
    $("<strong>").text("Request submission failed: ")
  );

  if (apiError.captcha) {
    $message.append($("<span>").text("Your request will result in a captcha. Please use the source editor instead."));
  } else {
    $message.append(apiError.html || apiError.info || apiError.code || "An API error occurred.");
  }

  return $message;
}
