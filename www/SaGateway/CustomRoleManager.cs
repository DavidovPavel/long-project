using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web;
using System.Web.Security;

namespace www.SaGateway
{
    public class CustomRoleManager : RoleProvider
    {
        private static string _adminUsers;

        static CustomRoleManager()
        {
            _adminUsers = ConfigurationManager.AppSettings["Administrators"];

        }
        public override bool IsUserInRole(string username, string roleName)
        {
            if (_adminUsers.IndexOf(username, StringComparison.InvariantCultureIgnoreCase) != -1 && String.Equals(roleName, "admin", StringComparison.OrdinalIgnoreCase)) return true;
            else
                if (String.Equals(roleName, "user", StringComparison.OrdinalIgnoreCase)) return true;
                else
                    return false;
        }

        public override string[] GetRolesForUser(string username)
        {
            if (_adminUsers.IndexOf(username, StringComparison.InvariantCultureIgnoreCase) != -1) return new[] {"Admin"};

            return new[] {"User"};
        }

        #region NotImplemented
        public override void CreateRole(string roleName)
        {
            throw new NotImplementedException();
        }

        public override bool DeleteRole(string roleName, bool throwOnPopulatedRole)
        {
            throw new NotImplementedException();
        }

        public override bool RoleExists(string roleName)
        {
            throw new NotImplementedException();
        }

        public override void AddUsersToRoles(string[] usernames, string[] roleNames)
        {
            throw new NotImplementedException();
        }

        public override void RemoveUsersFromRoles(string[] usernames, string[] roleNames)
        {
            throw new NotImplementedException();
        }

        public override string[] GetUsersInRole(string roleName)
        {
            throw new NotImplementedException();
        }

        public override string[] GetAllRoles()
        {
            throw new NotImplementedException();
        }

        public override string[] FindUsersInRole(string roleName, string usernameToMatch)
        {
            throw new NotImplementedException();
        }

        public override string ApplicationName { get; set; }
        #endregion
    }
}