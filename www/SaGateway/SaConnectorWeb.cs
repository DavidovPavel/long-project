using System;
using ABS.Connectivity;
using Anbr.Web.SA.CoreLogic;
using ANBR.Reporting.Contracts;
using ANBR.SemanticArchive.SDK;

namespace www.SaGateway
{
    public class SaConnectorWeb : SaConnectorBase
    {
        public static string GetDatabasePhisicalName(int dbId)
        {
#if (RELEASE)
            var dbs = AdminBridgeObserver.GetDatabases(new[] { dbId });
            if (dbs.Length != 1)
                return null;

            return dbs[0].Name;
#else
            return null;
#endif
        }

        /// <summary>
        /// Текущая база данных
        /// </summary>
        public IDataBase Database
        {
            get
            {
                int dbId = Convert.ToInt32(Scope.GetCurrentDBID());
                int prjId = Scope.GetInternalPrjIDi() ?? 0;

                return GetDataBase(dbId, prjId);
            }
        }

        public IDataBase GetDataBase(int dbId, int prjId, string dbName = null)
        {
            string userDescriptor = WebSaUtilities.GetCurrentUserID();

            dbName = dbName ?? GetDatabasePhisicalName(dbId);

            string error;
            IDataBase saDb;
            InitConnectionAndTry(dbId, dbName, userDescriptor, prjId, out saDb, out error);
            if (!String.IsNullOrWhiteSpace(error))
                LogBL.Write("SaConnectorWeb.GetDatabase", error);

            return saDb;
        }

        public IReportingService GetRepoting(int dbId, string dbName = null)
        {
            string userDescriptor = WebSaUtilities.GetCurrentUserID();

            dbName = dbName ?? GetDatabasePhisicalName(dbId);

            string error;
            IReportingService repSvc;
            InitReportingAndTry(dbId, dbName, userDescriptor, 0, out repSvc, out error);
            if (!String.IsNullOrWhiteSpace(error))
                LogBL.Write("SaConnectorWeb.GetReporting", error);

            return repSvc;
        }


        /// <summary>
        /// Текущее подключение к службе SQL Repoting
        /// </summary>
        public IReportingService Reporting
        {
            get
            {
                string userDescriptor = WebSaUtilities.GetCurrentUserID();
                int dbId = Convert.ToInt32(Scope.GetCurrentDBID());
                int prjId = Scope.GetInternalPrjIDi() ?? 0;
                string dbName = GetDatabasePhisicalName(dbId);

                string error;
                IReportingService repSvc;
                InitReportingAndTry(dbId, dbName, userDescriptor, prjId, out repSvc, out error);
                if (!String.IsNullOrWhiteSpace(error))
                    LogBL.Write("WebSaUtilities.Reporting", error);

                return repSvc;
            }
        }
    }
}