using Microsoft.AspNet.SignalR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Principal;
using System.Web;
using www.SaGateway;

namespace www.Hub
{
    public class CustomUserIdProvider : Microsoft.AspNet.SignalR.IUserIdProvider
    {
        public string GetUserId(IRequest request)
        {
            string userId = WebSaUtilities.GetCurrentUserID();
            
            return userId;
        }
    }
}