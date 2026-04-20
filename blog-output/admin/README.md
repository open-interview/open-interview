# Blog CMS Admin

A self-contained HTML page for managing `data/blog-posts.json` in the `open-interview/open-interview` GitHub repository.

## What it does

- Lists all blog posts with search/filter (handles 121+ posts via client-side search)
- Click any post to load it into an edit form
- Save edits → commits the updated JSON to GitHub → triggers `deploy-blog.yml`
- Delete a post → commits removal → triggers `deploy-blog.yml`
- Generate a new post → dispatches `content.yml` workflow with `mode=blog`

## How to get a Fine-Grained PAT

1. Go to **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens**
2. Click **Generate new token**
3. Set **Resource owner** to `open-interview`
4. Under **Repository access**, select **Only select repositories** → `open-interview`
5. Under **Permissions**, grant:
   - **Contents**: Read and write
   - **Actions**: Write
   - **Metadata**: Read (required automatically)
6. Click **Generate token** and copy it immediately

## Features

| Feature | How to use |
|---------|-----------|
| Auth | Paste your PAT and click Connect. It's stored in `sessionStorage` (cleared on tab close). |
| Post list | Scrollable list. Use the search box to filter by title, channel, or ID. |
| Edit post | Click any post in the list to load it into the form. Edit fields and click **Save & Deploy**. |
| Delete post | Load a post, then click **Delete** and confirm. |
| Generate post | Fill in Topic and Channel, click **Generate**. This dispatches `content.yml` with `mode=blog`. |

## Error handling

- **409 SHA conflict**: Another commit was made while you had the file open. Reload the page to get the latest SHA before saving again.
- **Auth failure**: Check that your PAT has the correct permissions and hasn't expired.

## Security notes

- The PAT is stored in `sessionStorage`, which is cleared when the browser tab is closed. It is **never** written to `localStorage` or sent anywhere except the GitHub API.
- Open this file locally (`file://`) or serve it from a trusted private origin — do not host it publicly.
- Use a fine-grained PAT scoped to only the `open-interview` repository to limit blast radius.
- Revoke the PAT from GitHub Settings if it is no longer needed.
