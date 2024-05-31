import { initUD } from "./pages/(un)deletions";
import { initGlobal } from "./pages/global";
import { initPermissions } from "./pages/permissions";

async function init() {
  const pageName = mw.config.get("wgPageName");
  if (pageName === "Steward_requests/(Un)deletions") {
    initUD();
  } else if (pageName === "Steward_requests/Permissions") {
    initPermissions();
  } else if (pageName === "Steward_requests/Global") {
    initGlobal();
  }
}

mw.loader
  .using([
    "mediawiki.api",
    "mediawiki.util",
    "mediawiki.Title",
    "mediawiki.Uri",
    "mediawiki.jqueryMsg",
    "oojs-ui-core",
    "oojs-ui-widgets",
    "oojs-ui-windows",
  ])
  .then(init);
