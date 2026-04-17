# Workflow Migration Checklist
## Consolidated Deployment Workflow Migration (2026-04-15)

### Migration Date
- **Consolidated:** April 15, 2026
- **Deprecation Window:** 30 days (until May 15, 2026)
- **Status:** IN PROGRESS

---

## Internal References Found & Required Actions

### ✅ Critical References (IN REPO)

#### 1. `.github/workflows/manual-intake.yml` - Line 48
**Status:** ⚠️ NEEDS IMMEDIATE FIX

**Current Code:**
```yaml
workflow_id: 'deploy-app.yml',
```

**Issue:** Triggers the old deprecated workflow instead of the new consolidated one

**Fix Required:**
```yaml
workflow_id: 'deploy.yml',
```

**Impact:** Manual question intake will trigger old deployment workflow
**Priority:** HIGH - Fix immediately to ensure new workflow is used

---

### ✅ Documentation References (ALREADY UPDATED)

#### 1. `.github/WORKFLOWS_GUIDE.md`
- ✅ Updated deploy-app.yml reference to "DEPRECATED"
- ✅ Updated scheduled-deploy.yml reference to "DEPRECATED"  
- ✅ Added deploy.yml documentation
- ✅ Updated command examples to use deploy.yml

#### 2. `.github/workflows/deploy-app.yml` & `scheduled-deploy.yml`
- ✅ Added deprecation notices
- ✅ Added removal date (2026-05-15)
- ✅ Added migration instructions
- ✅ Added reference to deploy.yml

---

## External System Checklist (OUT OF REPO)

### ⚠️ Items Requiring Manual Update (Not in Codebase)

These require manual review/updates by repository administrators:

1. **GitHub Branch Protection Rules**
   - [ ] Check if "deploy-app" status check is configured
   - [ ] Update to "deploy" status check
   - [ ] Verify other workflows still pass

2. **GitHub Secrets/Variables**
   - [ ] Verify GH_TOKEN exists and has proper permissions
   - [ ] Check if any secrets reference old workflow names

3. **External CI/CD Systems** (if any)
   - [ ] GitHub Pages settings (if custom)
   - [ ] Deployment status dashboards
   - [ ] Slack/Discord notifications referencing workflows
   - [ ] Monitoring/alerting systems

4. **Documentation Outside Repo**
   - [ ] Wiki pages
   - [ ] README files (if separate)
   - [ ] Team documentation
   - [ ] Deployment runbooks

5. **CI/CD Integration Tools**
   - [ ] Webhook configurations
   - [ ] GitHub App integrations
   - [ ] Status page integrations

---

## Search Commands for Finding Additional References

If you have external systems, search for:

```bash
# Search for deploy-app references
grep -r "deploy-app" /path/to/external/system

# Search for scheduled-deploy references
grep -r "scheduled-deploy" /path/to/external/system

# Search for workflow status checks
grep -r "status.*deploy" /path/to/external/system
```

---

## Migration Testing Checklist

- [ ] Fix manual-intake.yml reference to use deploy.yml
- [ ] Test manual workflow dispatch: `gh workflow run deploy.yml`
- [ ] Wait for next scheduled run (daily 2 AM UTC)
- [ ] Verify staged deployment succeeds
- [ ] Verify production deployment succeeds
- [ ] Check GitHub Pages reflects latest content
- [ ] Monitor for 24 hours for any issues

---

## Deprecation Timeline

| Date | Action |
|------|--------|
| 2026-04-15 | Workflows consolidated, old workflows marked deprecated |
| 2026-04-16 to 2026-05-14 | 30-day deprecation window - old workflows still functional |
| 2026-05-15 | Remove deploy-app.yml and scheduled-deploy.yml |

---

## Notes

- ✅ No external GitHub Actions marketplace references found
- ✅ No hardcoded URLs to workflow files found
- ⚠️ Manual fix needed: manual-intake.yml triggers old workflow
- ✅ Documentation references already updated
