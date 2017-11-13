using System.Threading.Tasks;
using VkSoft.Common;
using VkSoft.Common.Data;
using VkSoft.Richelieu.SDK;
using VkSoft.Richelieu.SDK.DataSources;
using VkSoft.Richelieu.ServiceContract;
using VkSoft.Richelieu.ServiceContract.Filters;

namespace www.Utilities
{
    public class CashObjectRepository
    {
        private static readonly RichelieuServer _richelieuServer;
        private static readonly Regions _regions;

        static CashObjectRepository()
        {
            _richelieuServer = RichelieuServer.SingleServer;
            _richelieuServer = new RichelieuServer(new UserAutentification(false, "Admin", "!QAZ1qaz"), "srv-sql3");
            _richelieuServer.CheckService();
            var dic = _richelieuServer.Dictionaries;
            _regions = dic.Regions;
        }

        public string GetRegionNameByID(int regionId)
        {
            DRegion reg = _regions.RegionById(regionId);
            if (reg != null)
                return reg.RegionName;
            return "";
        }

        public Task<IPagedDataSource> SearchPersons(DPersonFilter of)
        {
            var tcs = new TaskCompletionSource<IPagedDataSource>();
            var personDataSource = new EntityDataSource(_richelieuServer);

            personDataSource.OnPagedDataSourceComplited += tcs.SetResult;

            personDataSource.ObjectFilter = of;
            return tcs.Task;
        }

        public Task<IPagedDataSource> SearchOrganizations(DOrganizationFilter of)
        {
            var tcs = new TaskCompletionSource<IPagedDataSource>();
            var organizationDataSource = new EntityDataSource(_richelieuServer) { PageSize = 30 };

            organizationDataSource.OnPagedDataSourceComplited += tcs.SetResult;

            organizationDataSource.ObjectFilter = of;
            return tcs.Task;
        }
    }
}