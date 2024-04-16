import { initUD } from "./pages/(un)deletions";
import { initPermissions } from "./pages/permissions";

async function init() {
  const pageName = mw.config.get("wgPageName");
  if (pageName === "Steward_requests/(Un)deletions") {
    initUD();
  } else if (pageName === "Steward_requests/Permissions") {
    initPermissions();
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
