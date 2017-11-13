using System;
using System.Data;
using System.Linq;
using System.Text.RegularExpressions;
using ANBR.Common.Filters;
using ANBR.SDKHelper;
using ANBR.SemanticArchive.SDK;
using ANBR.SemanticArchive.SDK.MetaModel;
using ANBR.SemanticArchive.SDK.ObjectModel;
using ANBR.SemanticArchive.SDK.Queries;
using www.Areas.wiki.Models;

namespace www.SaGateway.BL
{
    public class WikiSABL
    {
        public static WikiPointModel[] GetAllEntryPoints()
        {
            string sql = @"select [Object_ID], Display_Name from dbo.ObjectData where IsMedia = 1 and deleted = 0";

            IQuery qr = WebSaUtilities.Database.QueriesProvider.CreateQuery();
            qr.Sql = sql;
            //qr.Parameters.CreateParam("@LeftObject_ID", QueryParameterType.Int).Value = new object[] { id };
            IQueryResult qres = qr.Execute();

            return qres.DataSet.Tables[0].AsEnumerable().Select(row =>
                new WikiPointModel()
                {
                    Object_ID = row.Field<Int32>("Object_ID"),
                    Display_Name = row.Field<String>("Display_Name")
                }
                ).ToArray();
        }

        public static bool IsMediaDocument(int objectID)
        {
            string sql = @"select top 1 [Object_ID], Display_Name from dbo.ObjectData where [Object_ID] = @Object_ID and IsMedia = 1 and deleted = 0";

            IQuery qr = WebSaUtilities.Database.QueriesProvider.CreateQuery();
            qr.Sql = sql;
            qr.Parameters.CreateParam("@Object_ID", QueryParameterType.Int).Value = new object[] { objectID };
            IQueryResult qres = qr.Execute();

            return (qres.DataSet.Tables[0].Rows.Count > 0);
        }


        public static void CreateRelationsFromText(IDataBase saDB, int objID, string text)
        {
            if (String.IsNullOrEmpty(text)) throw new ArgumentException("Text property shouln't be empty");

            IMetaRole role = saDB.MetaModel.MetaRoles.GetByName(_SAConst.Role_Ассоциативная_связь);
            ISaObject saObj = saDB.ObjectModel.GetObject(objID);

            SARelationData[] rels = SDKHelper.GetRelations(saDB, SDKHelper.SelectRelType.All, true, saObj);

            var re = new Regex(@"data-oknd=""3""\s+data-oid=""(\d+)""");
            MatchCollection mc = re.Matches(text);
            if (mc.Count > 0)
            {
                foreach (Match m in mc)
                    if (m.Groups.Count > 1)
                    {
                        int linkTo = Convert.ToInt32(m.Groups[1].Value);
                        if (!rels.Any(item => item.Object_ID == linkTo))
                            saObj.CreateRelation(role, linkTo);
                    }
                saObj.Save();
            }
        }
    }
}