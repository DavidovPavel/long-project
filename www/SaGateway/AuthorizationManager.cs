using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using Thinktecture.IdentityModel45.Authorization;
using System.Collections.ObjectModel;
using System.Xml.Linq;
using System.IO;
using System.Xml.XPath;
using System.Collections;
using System.Security.Claims;
using ANBR.Security.Common;

namespace www.SaGateway
{
    public class AuthorizationManager45 : ClaimsAuthorizationManager
    {
        private const string BaseClaimPrefix = "http://idsrv.anbr.ru/claims/";

        public override bool CheckAccess(AuthorizationContext context)
        {
            /*
            Trace.WriteLine("\n\nClaimsAuthorizationManager\n_______________________\n");

            Trace.WriteLine("\nAction:");
            Trace.WriteLine("  " + context.Action.First().Value);

            Trace.WriteLine("\nResources:");
            foreach (var resource in context.Resource)
            {
                Trace.WriteLine("  " + resource.Value);
            }

            Trace.WriteLine("\nClaims:");
            foreach (var claim in ((ClaimsIdentity)(context.Principal.Identity)).Claims)
            {
                Trace.WriteLine("  " + claim.Value);
            }
            */

            var action = context.Action.First();
            var id = context.Principal.Identities.First();

            if (action.Type.Equals(ClaimsAuthorization.ActionType))
                return AuthorizeCore(action, context.Resource, context.Principal.Identity as ClaimsIdentity);

            return base.CheckAccess(context);
        }

        protected virtual bool AuthorizeCore(Claim action, Collection<Claim> resource, ClaimsIdentity id)
        {
            switch (action.Value)
            {
                case Constants.Operation.Call:
                    return AuthorizeCall(resource, id);
                case Constants.Operation.InRoles:
                    return AuthorizeInRole(resource, id);
            }

            return false;
        }

        private List<string> GetRoles(Collection<Claim> resource, ClaimsIdentity id)
        {
            List<string> roles = id.FindAll(ClaimTypes.Role).Select(item => item.Value).ToList();
            var claim = id.FindFirst(BaseClaimPrefix + "Dependence");
            var dependencesValues = claim != null ? claim.Value : null;
            if (dependencesValues != null)
            {
                string queries = id.FindFirst(BaseClaimPrefix + "Query").Value;
                string descriptor = id.FindFirst(BaseClaimPrefix + "Descriptor").Value;
                descriptor = DecodeFrom64(descriptor);
                using (var reader = new StringReader(descriptor))
                {
                    XDocument doc = XDocument.Load(reader);
                    var dependences = new List<string>();
                    foreach (var item in dependencesValues.Split('|'))
                    {
                        var val = (object)SecurityEnvironment.GetSensibleData(item);
                        if (val != null)
                            dependences.Add(val.ToString());
                    }

                    if (!dependences.Any())
                        return roles;

                    string xpathExpr = String.Format(queries, dependences.ToArray());
                    var res = (IEnumerable)doc.XPathEvaluate(xpathExpr);
                    var internalroles = res.Cast<XAttribute>().Select(item => item.Value).ToList();
                    roles.AddRange(internalroles);
                    roles = roles.Distinct().ToList();
                }
            }

            return roles;
        }

        protected virtual bool AuthorizeInRole(Collection<Claim> resource, ClaimsIdentity id)
        {
            bool exists = false;
            try
            {
                List<string> roles = GetRoles(resource, id);
                exists = roles.Any(item => resource[0].Value.Split(',').Any(role => role.Trim().ToLower() == item.Trim().ToLower()));
            }
            catch
            {
#warning Требуется добавить логирование
            }
            return exists;
        }

        public static string DecodeFrom64(string encodedData)
        {
            byte[] encodedDataAsBytes = System.Convert.FromBase64String(encodedData);
            string returnValue = System.Text.UTF8Encoding.UTF8.GetString(encodedDataAsBytes);
            return returnValue;
        }

        protected virtual bool AuthorizeCall(Collection<Claim> resource, ClaimsIdentity id)
        {
            try
            {
                List<string> roles = GetRoles(resource, id);

                BitArray targetBits = null;
                foreach (var roleName in roles)
                {
                    string mask = id.FindFirst(BaseClaimPrefix + roleName).Value;
                    if (targetBits == null)
                    {
                        targetBits = mask.ToBitArray();
                        continue;
                    }

                    var bits = mask.ToBitArray();
                    targetBits = targetBits.Or(bits);
                }

                if (targetBits != null)
                {
                    int resID = Convert.ToInt32(resource[0].Value);
                    return targetBits[resID];
                }
            }
            catch
            {
                return false;
            }

            return false;
        }
    }
}