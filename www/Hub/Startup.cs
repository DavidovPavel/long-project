using Microsoft.AspNet.SignalR;
using Microsoft.Owin;
using Owin;
using www.Hub;

[assembly: OwinStartup(typeof(www.Startup))]
namespace www
{
    public class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            var idProvider = new CustomUserIdProvider();

            GlobalHost.DependencyResolver.Register(typeof(IUserIdProvider), () => idProvider);          

            app.MapSignalR();
        }
    }
}
