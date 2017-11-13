using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.Caching;
using System.Web.Hosting;
using ANBR.Reporting.Contracts;
using ANBR.SemanticArchive.SDK;
using www.Models;

namespace www.SaGateway.BL
{
    public class ReportingBL
    {
        static string ExtractNameFromPath(string repPath)
        {
            int cnt = repPath.Length - repPath.LastIndexOf('/') - 1;
            return repPath.Substring(repPath.LastIndexOf('/') + 1, cnt);
        }

        public static ReportingInfoModel[] GetReportsBySAType(IDataBase saDB, int saType)
        {
            List<ReportOnObject> reports = saDB.ReportingService.GetReports(saType * -1);

            return reports.Select(item => new ReportingInfoModel() { ReportDescription = item.ReportDescription, ReportSysName = ExtractNameFromPath(item.ReportPath) }).ToArray();
        }

        static string GetReportNameByDescription(IDataBase saDB, string reportDesc)
        {
            List<ReportOnObject> reports = saDB.ReportingService.GetReports(0);
            string repPath = reports.Where(item => item.ReportDescription == reportDesc).Select(item => item.ReportPath).FirstOrDefault();
            if (String.IsNullOrWhiteSpace(repPath))
                throw new InvalidOperationException("Invalid report name");

            return ExtractNameFromPath(repPath);
        }

        public static string GeneratePDFByReportName(IDataBase saDB, string repName, int saObjectID)
        {
            string cacheKey = saDB.ConnectionInfo.DatabaseName + "|" + repName + "|" + saObjectID;

            ObjectCache cache = System.Runtime.Caching.MemoryCache.Default;

            var reportFileName = (string)cache[cacheKey];
            if (reportFileName == null)
            {
                var policy = new CacheItemPolicy();
                policy.RemovedCallback = RemovedCallback;
                policy.AbsoluteExpiration = DateTimeOffset.UtcNow.AddMinutes(5);
                reportFileName = SDKHelper.GenerateReport(saDB.ReportingService, saObjectID, repName, true);
                cache.Set(cacheKey, reportFileName, policy);
            }

            return reportFileName;
        }

        private static void RemovedCallback(CacheEntryRemovedArguments arguments)
        {
            var fileName = (string)arguments.CacheItem.Value;
            try
            {
                if (!String.IsNullOrWhiteSpace(fileName))
                    File.Delete(HostingEnvironment.MapPath(fileName));
            }
            catch { }
        }
    }
}