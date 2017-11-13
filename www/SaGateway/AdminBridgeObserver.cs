using SaAdminBridgeContract;
using SaAdminBridgeContract.DTO;

namespace www.SaGateway
{
    public static class AdminBridgeObserver
    {
        public static ClientDTO[] GetClients(int[] clinetIds)
        {
            var sb = ANBR.Security.Common.SecurityEnvironment.ServiceRef<ISAAdminBridge>(www.SaGateway.SDKHelper.SAAdminBridgeKey);
            using (var wrapper = new ANBR.Security.Common.ServiceWrapper<ISAAdminBridge>(sb))
                return wrapper.Channel.GetClients(clinetIds);
        }

        public static ProjectDTO[] GetProjectsByClientID(int clientID)
        {
            var sb = ANBR.Security.Common.SecurityEnvironment.ServiceRef<ISAAdminBridge>(www.SaGateway.SDKHelper.SAAdminBridgeKey);
            using (var wrapper = new ANBR.Security.Common.ServiceWrapper<ISAAdminBridge>(sb))
                return wrapper.Channel.GetProjectsByClientID(clientID);
        }

        public static DatabaseDTO[] GetDatabasesByProjectID(int projectID)
        {
            var sb = ANBR.Security.Common.SecurityEnvironment.ServiceRef<ISAAdminBridge>(www.SaGateway.SDKHelper.SAAdminBridgeKey);
            using (var wrapper = new ANBR.Security.Common.ServiceWrapper<ISAAdminBridge>(sb))
                return wrapper.Channel.GetDatabasesByProjectID(projectID);
        }

        public static DatabaseDTO[] GetDatabases(int[] dbs)
        {
            var sb = ANBR.Security.Common.SecurityEnvironment.ServiceRef<ISAAdminBridge>(www.SaGateway.SDKHelper.SAAdminBridgeKey);
            using (var wrapper = new ANBR.Security.Common.ServiceWrapper<ISAAdminBridge>(sb))
                return wrapper.Channel.GetDatabases(dbs);
        }
    }
}