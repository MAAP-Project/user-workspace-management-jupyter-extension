import json
from pathlib import Path
from .handlers import InjectKeyHandler
from notebook.utils import url_path_join

from ._version import __version__


HERE = Path(__file__).parent.resolve()


with (HERE / "labextension" / "package.json").open() as fid:
    data = json.load(fid)


def _jupyter_labextension_paths():
    return [{
        "src": "labextension",
        "dest": data["name"]
    }]


def load_jupyter_server_extension(nb_server_app):
    """
    Called when the extension is loaded.
    Args:
        nb_server_app (NotebookWebApplication): handle to the Notebook webserver instance.
    """
    web_app = nb_server_app.web_app
    base_url = web_app.settings['base_url']
    host_pattern = '.*$'


    print('Installing jupyterlab_projects handler on path %s' % url_path_join(base_url, 'user_workspace_management_jupyter_extension'))
    print('base_url is '+base_url)

    web_app.add_handlers(host_pattern, [(url_path_join(base_url, 'user_workspace_management_jupyter_extension/inject_public_key'), InjectKeyHandler)])