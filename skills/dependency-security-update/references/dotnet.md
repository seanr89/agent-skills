# .NET (NuGet) reference

Run `dotnet restore` first; `dotnet list package` reads restored assets.

## Audit
- Vulnerable (incl. transitive): `dotnet list package --vulnerable --include-transitive`
- Outdated: `dotnet list package --outdated` (add `--include-transitive` if needed)
- Deprecated: `dotnet list package --deprecated`
- Run against the solution (`.sln`/`.slnx`) so all projects are covered.

Build-time auditing: NuGet Audit (on by default in recent SDKs) emits NU1901 to NU1904 warnings. Properties: `NuGetAudit`, `NuGetAuditMode` (`direct` or `all`; use `all` to include transitive), `NuGetAuditLevel` (`low`/`moderate`/`high`/`critical`). Do not lower the level or disable audit to make warnings disappear. Do not add `NuGetAuditSuppress` without user approval.

## Fix
Detect how versions are managed:
- **Central Package Management**: `Directory.Packages.props` with `ManagePackageVersionsCentrally=true`. Change the `<PackageVersion>` there, not in `.csproj` files.
- **Per-project**: edit `<PackageReference Version="...">` or use `dotnet add <project> package <Name> --version <ver>`.

Tier 1/2:
- Direct package: bump to the fixed version.
- Transitive package: either bump the direct parent, or
  - add a direct `<PackageReference>` to the fixed version, or
  - with CPM, enable transitive pinning: `<CentralPackageTransitivePinningEnabled>true</CentralPackageTransitivePinningEnabled>` and add a `<PackageVersion>` for the vulnerable package.

If the repo uses lock files (`packages.lock.json` / `RestorePackagesWithLockFile`), regenerate with `dotnet restore --force-evaluate` and commit the updated lock files. Use `--locked-mode` when verifying.

## Verify
`dotnet restore`, then `dotnet build --no-restore`, then `dotnet test --no-build`, then re-run the vulnerable listing.

## Gotchas
- Check `global.json` and target frameworks before bumping; a fixed version may require a newer TFM (that is a Tier 4 decision).
- Multiple feeds: check `nuget.config`; a fixed version may only exist on a feed that is not configured. Never print feed credentials.
- Floating versions (`1.*`): pin to a fixed version when remediating so the result is reproducible.
- Build-only packages (`PrivateAssets=all`) are lower exposure; still patch, but note it.
