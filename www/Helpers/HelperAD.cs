using System;
using System.DirectoryServices;
using System.DirectoryServices.AccountManagement;
using System.Security.Principal;
using System.Threading.Tasks;
using Anbr.Web.SA.CoreLogic;
using Anbr.Web.SA.CoreLogic.Model;

namespace www.Helpers
{
    public static class HelperAD
    {
        public static async Task<UserDTO> UserGetById(string uid, bool forceAdd)
        {
            var user = await UserBL.UserGet(uid);
            if (user == null)
            {
                var u = ADAccountSearch(uid);
                if (u == null && forceAdd)
                    u = new Tuple<string, string>(uid, "");

                if (u != null)
                    return await UserBL.AddUserIfNotExists(new UserDTO { UserUID = u.Item1, UserTitle = u.Item2 });
                return null;
            }

            return user;
        }

        static Tuple<string, string> ADAccountSearch(string searchText)
        {
            WindowsImpersonationContext context = null;
            try
            {
                // ReSharper disable once PossibleNullReferenceException
                if (!WindowsIdentity.GetCurrent().IsSystem)
                    context = WindowsIdentity.Impersonate(IntPtr.Zero);
            }
            catch (Exception ex)
            {
                LogBL.Write("Wall.ShareWith", ex.ToString());
                throw;
            }

            int slash = searchText.IndexOf("\\", StringComparison.Ordinal);
            if (slash != -1) searchText = searchText.Remove(0, slash + 1);
            slash = searchText.IndexOf("/", StringComparison.Ordinal);
            if (slash != -1) searchText = searchText.Remove(0, slash);

            try
            {
                string filter = $"(&(objectCategory=person)(objectClass=user)(|(mail={searchText})(samaccountname={searchText})(userPrincipalName={searchText})(sn={searchText})(cn={searchText})))";
                using (DirectorySearcher searcher = new System.DirectoryServices.DirectorySearcher(filter))
                using (var pc = new PrincipalContext(System.DirectoryServices.AccountManagement.ContextType.Domain, Environment.UserDomainName))
                {
                    SearchResult result = searcher.FindOne();
                    if (result == null) return null;

                    DirectoryEntry dentry = result.GetDirectoryEntry();
                    string userIdentityName;
                    using (
                        UserPrincipal p = UserPrincipal.FindByIdentity(pc,
                            dentry.Properties["userPrincipalName"].Value.ToString()))
                    {
                        var identity = new WindowsIdentity(p.UserPrincipalName);
                        userIdentityName = identity.Name;
                    }


                    return new Tuple<string, string>(userIdentityName, dentry.Properties["displayName"].Value.ToString());
                }
            }
            catch (Exception ex)
            {
                LogBL.Write("RobotsInfo", ex.ToString());
            }
            finally
            {
                try
                {
                    context?.Undo();
                }
                catch (Exception ex)
                {
                    LogBL.Write("RobotsInfo", ex.ToString());
                }
            }
            return null;
        }
    }
}
